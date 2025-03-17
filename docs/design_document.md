# Framer Motion LLM Chat App - Design Document

## UI Design Principles

- **Minimalist**: Clean interface with focus on content
- **Responsive**: Adapts to all screen sizes
- **Animated**: Smooth, purposeful animations
- **Accessible**: Usable by people with disabilities
- **Intuitive**: No learning curve required

## Color Palette

- **Primary**: `#4F46E5` (Indigo)
- **Secondary**: `#10B981` (Emerald)
- **Background**: `#FFFFFF` (White)
- **Dark Background**: `#111827` (Gray 900)
- **Text Primary**: `#1F2937` (Gray 800)
- **Text Secondary**: `#6B7280` (Gray 500)
- **User Message**: `#EEF2FF` (Indigo 50)
- **AI Message**: `#ECFDF5` (Emerald 50)
- **Accent**: `#8B5CF6` (Violet)
- **Error**: `#EF4444` (Red)

## Typography

- **Primary Font**: 'Inter', sans-serif
- **Monospace Font**: 'Fira Code', monospace (for code blocks)
- **Base Size**: 16px
- **Scale**: 1.25 (major third)

## Layout Structure

```
+--------------------------------------+
|              HEADER                  |
+--------------------------------------+
|                                      |
|                                      |
|            MESSAGE AREA              |
|                                      |
|                                      |
+--------------------------------------+
|              INPUT AREA              |
+--------------------------------------+
```

### Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## Component Design

### Header Component

```
+--------------------------------------+
| App Title                [Settings]  |
+--------------------------------------+
```

- App logo/title on left
- Settings button/icon on right
- Smooth animation when settings panel expands

### Settings Panel

```
+--------------------------------------+
| SETTINGS                     [Close] |
|--------------------------------------|
| API Key: [••••••••••••••]   [Save]   |
|                                      |
| Theme: [Light] [Dark] [System]       |
|                                      |
| Model: [GPT-3.5-Turbo]     ▼         |
+--------------------------------------+
```

- Slides in from top
- Form controls for API key and preferences
- Save button with success animation

### Message Area

```
+--------------------------------------+
|                                      |
|                            You  10:30|
| What can you tell me about Framer    |
| Motion?                              |
|                                      |
| AI Assistant                    10:31|
| Framer Motion is a production-ready  |
| motion library for React. Let me     |
| explain its key features...          |
|                                      |
+--------------------------------------+
```

- Clear visual distinction between user and AI messages
- User messages right-aligned with user avatar/identifier
- AI messages left-aligned with AI avatar/identifier
- Timestamps for each message
- Animation when new messages appear

### Input Area

```
+--------------------------------------+
| [Type a message...]        [Send ▶]  |
+--------------------------------------+
```

- Fixed at bottom of viewport
- Textarea that expands up to 4 lines
- Send button with hover/active animations
- Disabled state during AI response generation

## Animation Specifications

### Message Entry Animation

- **User Messages**: Slide in from right with slight bounce
- **AI Messages**: Fade in with typing effect
- **Duration**: 300-500ms
- **Easing**: Spring physics for natural feel

### Typing Indicator

```
+--------------------------------------+
|                                      |
| AI Assistant is typing...            |
| [●●●]                                |
|                                      |
+--------------------------------------+
```

- Three dots with pulsing animation
- Appears immediately after user sends message
- Disappears when AI response begins rendering

### Button Animations

- **Hover**: Scale up slightly (1.05)
- **Active/Click**: Scale down slightly (0.95)
- **Focus**: Glow effect with primary color

### Panel Transitions

- **Settings Open**: Slide down from top
- **Settings Close**: Slide up and out of view
- **Duration**: 250ms
- **Easing**: Ease-out for natural feel

## Mobile Adaptations

- Full-width messages on smaller screens
- Condensed header
- Larger touch targets for buttons
- Settings panel becomes full-screen modal

## Accessibility Considerations

- High contrast text for readability
- Keyboard focus indicators
- ARIA labels for all interactive elements
- Reduced motion option that respects `prefers-reduced-motion`

## Dark Mode Design

- Inverted color scheme with dark backgrounds
- Reduced brightness for comfortable night viewing
- Maintained contrast ratios for accessibility
- Smooth transition animation when switching modes

## UI States

### Loading State
- Subtle loading indicator during initial load
- Typing animation during AI response generation

### Empty State
```
+--------------------------------------+
|                                      |
|                                      |
|          [chat bubble icon]          |
|                                      |
|      Start a conversation with AI    |
|                                      |
|                                      |
+--------------------------------------+
```

### Error States
- API connection failures
- Invalid API key
- Rate limit exceeded
- Network offline

Each error state includes:
- Clear error message
- Suggested resolution
- Retry option where applicable 