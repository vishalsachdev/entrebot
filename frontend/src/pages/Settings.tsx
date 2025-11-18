import { motion } from 'framer-motion';
import { User, Bell, Shield, Palette } from 'lucide-react';
import {
  Container,
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Grid,
  Input,
  Button,
} from '../components/ui';
import { useAuth } from '../contexts/AuthContext';

const Settings = () => {
  const { user } = useAuth();

  return (
    <Container>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <PageHeader
          title="Settings"
          description="Manage your account and preferences"
        />

        <Grid cols={1} gap={6}>
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-primary-700" />
                </div>
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal details
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-2xl">
                <Input
                  label="Full Name"
                  defaultValue={user?.name}
                  placeholder="Enter your name"
                />
                <Input
                  label="Email"
                  type="email"
                  defaultValue={user?.email}
                  placeholder="Enter your email"
                  disabled
                  helperText="Email cannot be changed"
                />
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                  <Bell className="h-5 w-5 text-secondary-700" />
                </div>
                <div>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>
                    Manage how you receive updates
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-2xl">
                {[
                  {
                    label: 'Milestone Achievements',
                    description: 'Get notified when you complete milestones',
                  },
                  {
                    label: 'Agent Recommendations',
                    description: 'Receive suggestions for next steps',
                  },
                  {
                    label: 'Project Updates',
                    description: 'Stay informed about project progress',
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start justify-between py-3 border-b border-neutral-200 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-neutral-900">
                        {item.label}
                      </p>
                      <p className="text-sm text-neutral-600">
                        {item.description}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        defaultChecked
                      />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-accent-100 rounded-lg flex items-center justify-center">
                  <Palette className="h-5 w-5 text-accent-700" />
                </div>
                <div>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>
                    Customize your interface
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-w-2xl">
                <p className="text-sm text-neutral-600 mb-4">
                  Theme customization coming soon
                </p>
                <div className="flex gap-3">
                  <div className="h-20 w-20 bg-white border-2 border-neutral-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary-500 transition-colors">
                    <span className="text-xs font-medium">Light</span>
                  </div>
                  <div className="h-20 w-20 bg-neutral-900 border-2 border-neutral-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary-500 transition-colors opacity-50">
                    <span className="text-xs font-medium text-white">Dark</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-red-700" />
                </div>
                <div>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>
                    Manage your account security
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-2xl">
                <div>
                  <h4 className="font-medium text-neutral-900 mb-2">
                    Change Password
                  </h4>
                  <Button variant="secondary" size="sm">
                    Update Password
                  </Button>
                </div>
                <div className="pt-4 border-t border-neutral-200">
                  <h4 className="font-medium text-neutral-900 mb-2 text-red-700">
                    Danger Zone
                  </h4>
                  <p className="text-sm text-neutral-600 mb-3">
                    Once you delete your account, there is no going back.
                  </p>
                  <Button variant="danger" size="sm">
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </motion.div>
    </Container>
  );
};

export default Settings;
