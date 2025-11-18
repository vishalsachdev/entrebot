# UI Component Library

A comprehensive, accessible, and customizable UI component library built with React, TypeScript, and Tailwind CSS.

## Components

### Button

Versatile button component with multiple variants, sizes, and loading states.

**Props:**
- `variant`: 'primary' | 'secondary' | 'ghost' | 'danger' (default: 'primary')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `isLoading`: boolean (default: false)
- `leftIcon`: ReactNode
- `rightIcon`: ReactNode

**Example:**
```tsx
<Button variant="primary" size="md" leftIcon={<Mail />}>
  Send Email
</Button>
```

### Input

Text input component with label, error states, and icon support.

**Props:**
- `label`: string
- `error`: string
- `helperText`: string
- `leftIcon`: ReactNode
- `rightIcon`: ReactNode

**Example:**
```tsx
<Input
  label="Email"
  type="email"
  placeholder="Enter your email"
  error={errors.email}
  leftIcon={<Mail />}
/>
```

### Textarea

Multi-line text input with configurable resize behavior.

**Props:**
- `label`: string
- `error`: string
- `helperText`: string
- `resize`: 'none' | 'vertical' | 'horizontal' | 'both' (default: 'vertical')

**Example:**
```tsx
<Textarea
  label="Description"
  rows={4}
  placeholder="Enter description"
/>
```

### Card

Container component with header, content, and footer sections.

**Props:**
- `variant`: 'default' | 'bordered' | 'elevated' (default: 'default')
- `padding`: 'none' | 'sm' | 'md' | 'lg' (default: 'md')

**Sub-components:**
- `CardHeader`
- `CardTitle`
- `CardDescription`
- `CardContent`
- `CardFooter`

**Example:**
```tsx
<Card variant="elevated">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Modal

Accessible modal dialog built with Headless UI.

**Props:**
- `isOpen`: boolean (required)
- `onClose`: () => void (required)
- `title`: string
- `description`: string
- `size`: 'sm' | 'md' | 'lg' | 'xl' | 'full' (default: 'md')
- `showCloseButton`: boolean (default: true)
- `closeOnOverlayClick`: boolean (default: true)

**Example:**
```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  size="md"
>
  <p>Are you sure you want to proceed?</p>
  <ModalFooter>
    <Button variant="ghost" onClick={() => setIsOpen(false)}>
      Cancel
    </Button>
    <Button variant="primary" onClick={handleConfirm}>
      Confirm
    </Button>
  </ModalFooter>
</Modal>
```

### Badge

Small status indicator or label component.

**Props:**
- `variant`: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral' (default: 'primary')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')

**Example:**
```tsx
<Badge variant="success">Active</Badge>
```

### Alert

Notification component for displaying important messages.

**Props:**
- `variant`: 'info' | 'success' | 'warning' | 'error' (default: 'info')
- `title`: string
- `onClose`: () => void
- `icon`: ReactNode

**Example:**
```tsx
<Alert
  variant="success"
  title="Success"
  onClose={() => setShowAlert(false)}
>
  Your changes have been saved.
</Alert>
```

### Spinner

Loading spinner with multiple sizes and colors.

**Props:**
- `size`: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
- `color`: 'primary' | 'secondary' | 'white' | 'neutral' (default: 'primary')

**Example:**
```tsx
<Spinner size="lg" color="primary" />
```

### Skeleton

Loading placeholder components.

**Components:**
- `Skeleton`: Basic skeleton loader
- `SkeletonText`: Multi-line text skeleton
- `SkeletonCard`: Card-shaped skeleton

**Example:**
```tsx
<SkeletonCard />
<SkeletonText lines={3} />
```

### Layout Components

#### Layout
Main layout wrapper for pages.

#### Container
Responsive container with max-width constraints.

**Props:**
- `size`: 'sm' | 'md' | 'lg' | 'xl' | 'full' (default: 'xl')

#### PageHeader
Page header with title, description, and actions.

**Props:**
- `title`: string (required)
- `description`: string
- `actions`: ReactNode

#### Grid
Responsive grid layout.

**Props:**
- `cols`: 1 | 2 | 3 | 4 | 6 | 12 (default: 3)
- `gap`: 2 | 4 | 6 | 8 (default: 6)

#### Stack
Flexbox-based layout for stacking elements.

**Props:**
- `direction`: 'horizontal' | 'vertical' (default: 'vertical')
- `spacing`: 2 | 4 | 6 | 8 (default: 4)
- `align`: 'start' | 'center' | 'end' | 'stretch' (default: 'stretch')
- `justify`: 'start' | 'center' | 'end' | 'between' (default: 'start')

#### Divider
Visual separator line.

**Props:**
- `orientation`: 'horizontal' | 'vertical' (default: 'horizontal')

**Example:**
```tsx
<Layout>
  <Container size="lg">
    <PageHeader
      title="Dashboard"
      description="Welcome back"
      actions={<Button>New Project</Button>}
    />
    <Grid cols={3} gap={6}>
      <Card>Card 1</Card>
      <Card>Card 2</Card>
      <Card>Card 3</Card>
    </Grid>
  </Container>
</Layout>
```

## Accessibility

All components follow accessibility best practices:
- Proper ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader compatibility
- Semantic HTML structure

## Customization

Components use Tailwind CSS and can be customized via:
1. The `className` prop for additional styles
2. Tailwind config for global theme changes
3. CSS variables for color schemes

## Testing

To view all components in action, navigate to `/components` in the development server.
