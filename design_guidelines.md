# Design Guidelines: AI Sentiment Analysis Application

## Design Approach
**Reference-Based Approach** - This is a utility-focused application analyzing customer feedback. Drawing from modern data analysis tools like Linear, Notion, and productivity dashboards while maintaining the established teal-accented Interswitch brand identity from the provided design.

## Core Design Elements

### Typography
- **Primary Font**: Inter or similar modern sans-serif via Google Fonts
- **Headings**: 
  - H1: text-4xl font-bold (main title)
  - H2: text-2xl font-semibold (section headers)
  - H3: text-lg font-medium (card titles, labels)
- **Body**: text-base font-normal for all content, descriptions
- **Labels**: text-sm font-medium uppercase tracking-wide for input labels
- **Results/Metrics**: text-3xl font-bold for sentiment scores

### Layout System
- **Spacing Units**: Consistent use of Tailwind spacing - 4, 6, 8, 12, 16, 20, 24
- **Container**: max-w-7xl mx-auto px-6 for main content
- **Section Padding**: py-12 md:py-20 for vertical spacing
- **Card Padding**: p-6 md:p-8 for component interiors
- **Gaps**: gap-6 for card grids, gap-4 for form elements

### Component Library

#### Header/Navigation
- Fixed top navigation with Interswitch branding
- Logo left-aligned, utility links right-aligned
- Height: h-16 with shadow-sm border-b

#### Main Analysis Interface
- **Input Section**:
  - Large textarea (min-h-64) for customer feedback input
  - Character counter (text-sm text-gray-500) in bottom-right
  - Quick sample buttons (3-4 examples) as pills with hover states
  - Label positioned above textarea with clear hierarchy

- **Action Button**:
  - Primary CTA: "Analyze Sentiment" - prominent, full-width on mobile, auto-width on desktop
  - Loading state with spinner icon and disabled opacity
  - Positioned below textarea with mt-6

#### Results Display (Post-Analysis)
Three-column grid on desktop (grid-cols-1 md:grid-cols-3 gap-6):

1. **Sentiment Score Card**:
   - Large percentage/score display (text-5xl font-bold)
   - Sentiment label (Positive/Negative/Neutral) with visual indicator
   - Confidence level as secondary metric
   - Rounded border with subtle shadow

2. **Emotion Detection Card**:
   - List of detected emotions with intensity indicators
   - Each emotion as a tag/badge with teal accents
   - Vertical stack with gap-3
   - Icons for each emotion type

3. **Key Insights Card**:
   - Bulleted list of actionable recommendations
   - Each insight in its own row with left border accent
   - AI-generated suggestions formatted clearly
   - Summary text at bottom

#### Empty State
- Centered content when no analysis has been run
- Icon illustration (document/chat icon)
- Instructional text: "Paste customer feedback above to analyze sentiment"
- Soft gray background treatment

### Visual Hierarchy
- Teal accent color (#0D9488 or similar) for primary actions, links, and emphasis
- Gray scale for backgrounds: bg-gray-50 (page), bg-white (cards), bg-gray-100 (inputs)
- Border treatment: border border-gray-200 for cards, focus:border-teal-500 for inputs
- Shadow levels: shadow-sm for cards, shadow-md for elevated states

### Responsive Behavior
- Mobile (base): Single column layout, full-width components, py-8 spacing
- Tablet (md): Two-column for certain sections, increased spacing to py-12
- Desktop (lg): Three-column results grid, max-width containers, py-20 spacing
- All cards stack to single column below md breakpoint

### Interactive States
- Input focus: Teal border with subtle ring
- Buttons: Teal background with darker hover state, disabled opacity-50
- Cards: Subtle hover lift (hover:shadow-md transition-shadow)
- Sample buttons: Border style with hover:bg-teal-50 transition

### Micro-interactions
- Fade-in animation for results appearing after analysis
- Smooth height transitions for expanding sections
- Loading spinner during API calls
- Success checkmark animation on completion

## Brand Consistency
- Maintain Interswitch teal accent throughout
- Professional, trustworthy aesthetic appropriate for B2B SaaS
- Clean, uncluttered interface prioritizing readability
- Consistent spacing rhythm creates visual calm