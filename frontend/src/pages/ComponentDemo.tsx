import { useState } from 'react';
import {
  Button,
  Input,
  Textarea,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Modal,
  ModalFooter,
  Badge,
  Alert,
  Spinner,
  SkeletonCard,
  Layout,
  Container,
  PageHeader,
  Grid,
  Stack,
} from '../components/ui';
import { Mail, Search, Send } from 'lucide-react';

const ComponentDemo = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(true);

  return (
    <Layout>
      <Container>
        <PageHeader
          title="UI Component Library"
          description="Showcase of all available UI components"
          actions={
            <Button onClick={() => setIsModalOpen(true)}>
              Open Modal
            </Button>
          }
        />

        <Stack direction="vertical" spacing={8}>
          {/* Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>Various button styles and states</CardDescription>
            </CardHeader>
            <CardContent>
              <Stack direction="horizontal" spacing={4}>
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="primary" isLoading>Loading</Button>
                <Button variant="primary" disabled>Disabled</Button>
              </Stack>
              <div className="mt-4">
                <Stack direction="horizontal" spacing={4}>
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </Stack>
              </div>
              <div className="mt-4">
                <Stack direction="horizontal" spacing={4}>
                  <Button leftIcon={<Mail className="h-4 w-4" />}>
                    With Icon
                  </Button>
                  <Button rightIcon={<Send className="h-4 w-4" />}>
                    Send Message
                  </Button>
                </Stack>
              </div>
            </CardContent>
          </Card>

          {/* Inputs */}
          <Card>
            <CardHeader>
              <CardTitle>Form Inputs</CardTitle>
              <CardDescription>Text inputs and textareas</CardDescription>
            </CardHeader>
            <CardContent>
              <Stack direction="vertical" spacing={4}>
                <Input
                  label="Email"
                  type="email"
                  placeholder="Enter your email"
                  helperText="We'll never share your email"
                />
                <Input
                  label="Search"
                  placeholder="Search..."
                  leftIcon={<Search className="h-4 w-4" />}
                />
                <Input
                  label="With Error"
                  error="This field is required"
                  placeholder="Enter value"
                />
                <Textarea
                  label="Message"
                  placeholder="Enter your message"
                  rows={4}
                  helperText="Maximum 500 characters"
                />
              </Stack>
            </CardContent>
          </Card>

          {/* Badges */}
          <Card>
            <CardHeader>
              <CardTitle>Badges</CardTitle>
              <CardDescription>Status indicators and labels</CardDescription>
            </CardHeader>
            <CardContent>
              <Stack direction="horizontal" spacing={2}>
                <Badge variant="primary">Primary</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="accent">Accent</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="danger">Danger</Badge>
                <Badge variant="neutral">Neutral</Badge>
              </Stack>
            </CardContent>
          </Card>

          {/* Alerts */}
          {showAlert && (
            <Alert
              variant="info"
              title="Information"
              onClose={() => setShowAlert(false)}
            >
              This is an informational alert with a close button.
            </Alert>
          )}

          <Grid cols={2} gap={4}>
            <Alert variant="success" title="Success">
              Your changes have been saved successfully.
            </Alert>
            <Alert variant="warning" title="Warning">
              Please review your input before submitting.
            </Alert>
            <Alert variant="error" title="Error">
              An error occurred while processing your request.
            </Alert>
            <Alert variant="info">
              Alert without a title.
            </Alert>
          </Grid>

          {/* Loading States */}
          <Card>
            <CardHeader>
              <CardTitle>Loading States</CardTitle>
              <CardDescription>Spinners and skeletons</CardDescription>
            </CardHeader>
            <CardContent>
              <Stack direction="vertical" spacing={6}>
                <div>
                  <h4 className="text-sm font-medium mb-3">Spinners</h4>
                  <Stack direction="horizontal" spacing={4} align="center">
                    <Spinner size="sm" />
                    <Spinner size="md" />
                    <Spinner size="lg" />
                    <Spinner size="xl" />
                  </Stack>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-3">Skeleton Loaders</h4>
                  <Grid cols={2} gap={4}>
                    <SkeletonCard />
                    <SkeletonCard />
                  </Grid>
                </div>
              </Stack>
            </CardContent>
          </Card>

          {/* Cards */}
          <Grid cols={3} gap={6}>
            <Card variant="default">
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
                <CardDescription>Standard card style</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600">
                  This is a default card with shadow and border.
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>

            <Card variant="bordered">
              <CardHeader>
                <CardTitle>Bordered Card</CardTitle>
                <CardDescription>Emphasized border</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600">
                  This card has a thicker border.
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Elevated Card</CardTitle>
                <CardDescription>Enhanced shadow</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600">
                  This card has a larger shadow.
                </p>
              </CardContent>
            </Card>
          </Grid>
        </Stack>

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Example Modal"
          description="This is a modal dialog example"
          size="md"
        >
          <div className="space-y-4">
            <Input label="Name" placeholder="Enter your name" />
            <Textarea label="Description" placeholder="Enter description" rows={3} />
          </div>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>
              Save Changes
            </Button>
          </ModalFooter>
        </Modal>
      </Container>
    </Layout>
  );
};

export default ComponentDemo;
