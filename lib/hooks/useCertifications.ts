import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../auth';

export interface Certification {
  id: string;
  title: string;
  description: string | null;
  price_cents: number;
  badge_image_url: string | null;
  requires_review: boolean;
  is_active: boolean;
  required_modules?: {
    module_id: string;
    modules: {
        id: string;
        title: string;
    };
  }[];
  user_status?: {
      status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'resubmitted';
      feedback: string | null;
  } | null;
  is_qualified?: boolean;
  progress_percentage?: number;
  requirements_breakdown?: {
      moduleId: string;
      title: string;
      completed: boolean;
      totalVideos: number;
      completedVideos: number;
  }[];
}

// No modification needed here if previous worked.
export function useCertifications() {
  const { user } = useAuth();
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCertifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch active certifications
      const { data: certsData, error: certsError } = await supabase
        .from('certification_settings')
        .select(`
            *,
            required_modules:certification_required_modules(
                module_id,
                modules(id, title)
            )
        `)
        .eq('is_active', true);

      if (certsError) throw certsError;

      if (!certsData || certsData.length === 0) {
        setCertifications([]);
        setLoading(false);
        return;
      }

      // 2. Fetch user status if logged in
      let userStatuses: Record<string, any> = {};
      let completedVideoIds = new Set<string>();

      if (user?.id) {
          // Fetch user certification submissions
          const { data: submissions } = await supabase
            .from('user_certifications')
            .select('certification_id, status, feedback')
            .eq('user_id', user.id);
            
          if (submissions) {
              submissions.forEach(sub => {
                  userStatuses[sub.certification_id] = sub;
              });
          }

          // Fetch all user video progress (completed only)
          const { data: progressData } = await supabase
            .from('video_progress')
            .select('video_id')
            .eq('user_id', user.id)
            .eq('completed', true);
            
          if (progressData) {
              progressData.forEach(p => completedVideoIds.add(p.video_id));
          }
      }

      // 3. Calculate qualification for each certification
      const processedCerts = await Promise.all(certsData.map(async (cert) => {
          let totalVideos = 0;
          let totalCompletedVideos = 0;
          let requirementsBreakdown: any[] = [];
          
          if (cert.required_modules && cert.required_modules.length > 0) {
              const moduleIds = cert.required_modules.map((m: any) => m.module_id);
              
              // Fetch videos for required modules
              const { data: videos } = await supabase
                .from('videos')
                .select('id, module_id')
                .in('module_id', moduleIds)
                .eq('is_published', true);
                
              if (videos) {
                  // Group videos by module
                  const videosByModule: Record<string, string[]> = {};
                  videos.forEach(v => {
                      if (!videosByModule[v.module_id!]) videosByModule[v.module_id!] = [];
                      videosByModule[v.module_id!].push(v.id);
                  });

                  // Build breakdown
                  requirementsBreakdown = cert.required_modules.map((m: any) => {
                       const moduleVideos = videosByModule[m.module_id] || [];
                       const moduleTotal = moduleVideos.length;
                       const moduleCompleted = moduleVideos.filter(vid => completedVideoIds.has(vid)).length;
                       
                       totalVideos += moduleTotal;
                       totalCompletedVideos += moduleCompleted;
                       
                       return {
                           moduleId: m.module_id,
                           title: m.modules?.title || 'Unknown Module',
                           completed: moduleTotal > 0 && moduleTotal === moduleCompleted,
                           totalVideos: moduleTotal,
                           completedVideos: moduleCompleted
                       };
                  });
              }
          }

          return {
              ...cert,
              user_status: userStatuses[cert.id] || null,
              is_qualified: totalVideos > 0 && totalCompletedVideos === totalVideos,
              progress_percentage: totalVideos > 0 ? Math.round((totalCompletedVideos / totalVideos) * 100) : 0,
              requirements_breakdown: requirementsBreakdown
          };
      }));

      setCertifications(processedCerts);

    } catch (err) {
      console.error('Error fetching certifications:', err);
      setError('Failed to load certifications');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchCertifications();
  }, [fetchCertifications]);

  return { certifications, loading, error, refetch: fetchCertifications };
}

// ... existing imports

export const useCertification = (id: string | undefined) => {
    const { user } = useAuth();
    const [certification, setCertification] = useState<Certification | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCertification = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            setError(null);

            // Fetch specific certification
            const { data: certData, error: certError } = await supabase
                .from('certification_settings')
                .select(`
                    *,
                    required_modules:certification_required_modules(
                        module_id,
                        modules(id, title)
                    )
                `)
                .eq('id', id)
                .single();

            if (certError) throw certError;
            if (!certData) throw new Error('Certification not found');

             // 2. Fetch user status if logged in
            let userStatus = null;
            let completedVideoIds = new Set<string>();

            if (user?.id) {
                // Fetch user submission for this cert
                const { data: submission } = await supabase
                    .from('user_certifications')
                    .select('status, feedback, submission_video_url')
                    .eq('user_id', user.id)
                    .eq('certification_id', id)
                    .maybeSingle();
                
                if (submission) {
                    userStatus = submission;
                }

                // Fetch progress
                const { data: progressData } = await supabase
                    .from('video_progress')
                    .select('video_id')
                    .eq('user_id', user.id)
                    .eq('completed', true);
                    
                if (progressData) {
                    progressData.forEach(p => completedVideoIds.add(p.video_id));
                }
            }

            // 3. Calculate qualification
            let totalVideos = 0;
            let completedVideos = 0;
            
            if (certData.required_modules && certData.required_modules.length > 0) {
                const moduleIds = certData.required_modules.map((m: any) => m.module_id);
                const { data: videos } = await supabase
                    .from('videos')
                    .select('id, module_id')
                    .in('module_id', moduleIds)
                    .eq('is_published', true);
                    
                if (videos) {
                    totalVideos = videos.length;
                    completedVideos = videos.filter(v => completedVideoIds.has(v.id)).length;
                }
            }

            setCertification({
                ...certData,
                user_status: userStatus,
                is_qualified: totalVideos > 0 && completedVideos === totalVideos,
                progress_percentage: totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0
            });

        } catch (err) {
            console.error('Error fetching certification:', err);
            setError(err instanceof Error ? err.message : 'Error loading certification');
        } finally {
            setLoading(false);
        }
    }, [id, user?.id]);

    useEffect(() => {
        fetchCertification();
    }, [fetchCertification]);

    return { certification, loading, error, refetch: fetchCertification };
};

export function useSubmitCertification() {
    const { user } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submitApplication = async (certificationId: string, videoUrl?: string) => {
        if (!user?.id) return false;
        
        setSubmitting(true);
        setError(null);
        
        try {
            // Check if exists first to update or insert
            const { data: existing } = await supabase
                .from('user_certifications')
                .select('id, status, attempt_number')
                .eq('user_id', user.id)
                .eq('certification_id', certificationId)
                .maybeSingle();

            if (existing) {
                 const isResubmission = existing.status === 'rejected';
                 const nextAttempt = isResubmission ? (existing.attempt_number || 1) + 1 : existing.attempt_number || 1;
                 const { error: updateError } = await supabase
                    .from('user_certifications')
                    .update({
                        status: isResubmission ? 'resubmitted' : 'submitted',
                        submission_video_url: videoUrl || null,
                        attempt_number: nextAttempt,
                        submitted_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id);
                 if (updateError) throw updateError;
            } else {
                const { error: insertError } = await supabase.from('user_certifications').insert({
                    user_id: user.id,
                    certification_id: certificationId,
                    status: 'submitted',
                    submission_video_url: videoUrl || null,
                    attempt_number: 1,
                    submitted_at: new Date().toISOString()
                });
                if (insertError) throw insertError;
            }
            
            return true;
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Failed to submit application');
            return false;
        } finally {
            setSubmitting(false);
        }
    };

    return { submitApplication, submitting, error };
}
