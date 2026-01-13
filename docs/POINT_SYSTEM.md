# Community Point System

Bob University's community features a gamification system that rewards engagement and helps identify active, helpful members.

## Earning Points

Points are awarded automatically when users engage with the community:

| Action | Points Earned | Description |
|--------|---------------|-------------|
| Create a post | +10 | Share your work, ask questions, or post tips |
| Write a comment | +5 | Engage with others' posts |
| Receive a comment | +3 | Awarded to post author when someone comments |
| React to a post | +2 | Like, 🔥, 💇, or 💡 reactions |
| Receive a reaction | +1 | Awarded to post author when someone reacts |
| Receive a comment like | +1 | Awarded when someone likes your comment |

## Level System

Levels are calculated based on total points earned. Higher levels require progressively more points to achieve.

| Level | Points Required | Title | Badge Color |
|-------|-----------------|-------|-------------|
| 1 | 0 | Newcomer | Gray |
| 2 | 50 | Contributor | Dark Gray |
| 3 | 150 | Regular | Green |
| 4 | 300 | Active Member | Emerald |
| 5 | 500 | Engaged | Blue |
| 6 | 800 | Enthusiast | Indigo |
| 7 | 1,200 | Expert | Purple |
| 8 | 1,700 | Master | Pink |
| 9 | 2,400 | Legend | Amber |
| 10 | 3,500 | Community Champion | Gold |

### Points Required Between Levels

| From → To | Points Needed |
|-----------|---------------|
| Level 1 → 2 | 50 |
| Level 2 → 3 | 100 |
| Level 3 → 4 | 150 |
| Level 4 → 5 | 200 |
| Level 5 → 6 | 300 |
| Level 6 → 7 | 400 |
| Level 7 → 8 | 500 |
| Level 8 → 9 | 700 |
| Level 9 → 10 | 1,100 |

## Badges & Recognition

### Level Badge
- Displayed on the bottom-right of user avatars
- Shows the user's current level number
- Color progresses from gray (Level 1) to gold (Level 10)
- Visible on posts, comments, and profile pages

### Certification Badge
- Checkmark badge displayed on the top-right of avatars
- Awarded automatically at **Level 6** (800+ points)
- Indicates a trusted, engaged community member
- Label "Certified Stylist" shown on profile

## Profile Progress

User profiles display:
- Current level and title
- Total points earned
- Progress ring around avatar showing progress to next level
- Points remaining to reach the next level
- "Max Level Achieved!" badge for Level 10 users

## Example Progression Paths

### Reaching Level 2 (50 points)
- Create 5 posts (5 × 10 = 50 pts)
- Write 10 comments (10 × 5 = 50 pts)
- Create 2 posts + write 6 comments (20 + 30 = 50 pts)

### Reaching Level 5 (500 points)
- Create 30 posts + receive 50 reactions (300 + 50 + engagement bonus)
- Active commenting and posting over 2-3 weeks

### Reaching Level 10 (3,500 points)
- Requires sustained, long-term community engagement
- Combination of creating valuable content and helping others
- Typically achieved over several months of active participation

## Technical Implementation

Points are awarded automatically via PostgreSQL triggers:
- `on_community_post_insert` - Awards points for new posts
- `on_community_comment_insert` - Awards points for comments
- `on_community_reaction_change` - Awards points for reactions
- `on_comment_like_change` - Awards points for comment likes

Levels are recalculated automatically when points change using the `calculate_community_level()` function.

## Design Philosophy

1. **Reward engagement, not just content creation** - Both creating and interacting earn points
2. **Progressive difficulty** - Higher levels feel like meaningful achievements
3. **Visible recognition** - Badges make active members easy to identify
4. **Encourage quality** - Receiving engagement rewards creating valuable content
5. **Long-term engagement** - Max level requires sustained participation, not quick grinding
