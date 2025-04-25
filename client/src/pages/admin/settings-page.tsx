import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

const profileFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const notificationFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  browserNotifications: z.boolean().default(true),
});

const systemSettingsSchema = z.object({
  linkExpiry: z.boolean().default(true),
  uploadQuality: z.string().min(1, "Please select an upload quality"),
  videoQuality: z.string().min(1, "Please select a video quality"),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;
type NotificationFormValues = z.infer<typeof notificationFormSchema>;
type SystemSettingsValues = z.infer<typeof systemSettingsSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [storageUsed] = useState(4.2); // In GB
  const [storageLimit] = useState(10); // In GB
  const storagePercentage = (storageUsed / storageLimit) * 100;

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "Admin",
      lastName: "User",
      email: user?.username || "",
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Notification form
  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: true,
      browserNotifications: true,
    },
  });

  // System settings form
  const systemSettingsForm = useForm<SystemSettingsValues>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: {
      linkExpiry: true,
      uploadQuality: "high",
      videoQuality: "high",
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PUT", "/api/settings/profile", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      const res = await apiRequest("PUT", "/api/settings/password", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully",
      });
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update notifications mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: NotificationFormValues) => {
      const res = await apiRequest("PUT", "/api/settings/notifications", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Notifications updated",
        description: "Your notification preferences have been updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update system settings mutation
  const updateSystemSettingsMutation = useMutation({
    mutationFn: async (data: SystemSettingsValues) => {
      const res = await apiRequest("PUT", "/api/settings/system", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "System settings have been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Submit handlers
  const onSubmitProfile = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  const onSubmitPassword = (data: PasswordFormValues) => {
    updatePasswordMutation.mutate(data);
  };

  const onSubmitNotifications = (data: NotificationFormValues) => {
    updateNotificationsMutation.mutate(data);
  };

  const onSubmitSystemSettings = (data: SystemSettingsValues) => {
    updateSystemSettingsMutation.mutate(data);
  };

  return (
    <AdminLayout title="Settings">
      <div className="space-y-6">
        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>
              Manage your account information and password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-4">
                Personal Information
              </h3>
              <Form {...profileForm}>
                <form
                  onSubmit={profileForm.handleSubmit(onSubmitProfile)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email address</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      isLoading={updateProfileMutation.isPending}
                    >
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            </div>

            <Separator />

            {/* Change Password */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-4">
                Change Password
              </h3>
              <Form {...passwordForm}>
                <form
                  onSubmit={passwordForm.handleSubmit(onSubmitPassword)}
                  className="space-y-4"
                >
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" />
                        </FormControl>
                        <FormDescription>
                          Password must be at least 8 characters and include uppercase, lowercase, and numbers
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      isLoading={updatePasswordMutation.isPending}
                    >
                      Update Password
                    </Button>
                  </div>
                </form>
              </Form>
            </div>

            <Separator />

            {/* Notifications */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-4">
                Notifications
              </h3>
              <Form {...notificationForm}>
                <form
                  onSubmit={notificationForm.handleSubmit(onSubmitNotifications)}
                  className="space-y-4"
                >
                  <FormField
                    control={notificationForm.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Email notifications</FormLabel>
                          <FormDescription>
                            Receive email notifications when clients access their repositories
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={notificationForm.control}
                    name="browserNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Browser notifications</FormLabel>
                          <FormDescription>
                            Receive browser notifications when using the application
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      isLoading={updateNotificationsMutation.isPending}
                    >
                      Save Preferences
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>
              Configure storage and system preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Storage */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-4">
                Storage
              </h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Storage Usage
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    {storageUsed} GB / {storageLimit} GB
                  </span>
                </div>
                <Progress value={storagePercentage} className="h-2" />
              </div>
              <div className="mt-4">
                <Button variant="outline" className="text-primary">
                  Upgrade Storage Plan
                </Button>
              </div>
            </div>

            <Separator />

            {/* Security and Quality Settings */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-4">
                Advanced Settings
              </h3>
              <Form {...systemSettingsForm}>
                <form
                  onSubmit={systemSettingsForm.handleSubmit(
                    onSubmitSystemSettings
                  )}
                  className="space-y-4"
                >
                  <FormField
                    control={systemSettingsForm.control}
                    name="linkExpiry"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Client link expiration</FormLabel>
                          <FormDescription>
                            Automatically expire client links after 90 days of inactivity
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={systemSettingsForm.control}
                    name="uploadQuality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default upload quality</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select upload quality" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="high">
                              High (original size)
                            </SelectItem>
                            <SelectItem value="medium">
                              Medium (1920px width max)
                            </SelectItem>
                            <SelectItem value="low">
                              Low (1280px width max)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Set the default quality for uploaded images
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={systemSettingsForm.control}
                    name="videoQuality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default video quality</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select video quality" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="high">High (1080p)</SelectItem>
                            <SelectItem value="medium">Medium (720p)</SelectItem>
                            <SelectItem value="low">Low (480p)</SelectItem>
                            <SelectItem value="auto">Auto (adaptive)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Set the default quality for embedded videos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        systemSettingsForm.reset({
                          linkExpiry: true,
                          uploadQuality: "high",
                          videoQuality: "high",
                        });
                      }}
                    >
                      Restore Defaults
                    </Button>
                    <Button
                      type="submit"
                      isLoading={updateSystemSettingsMutation.isPending}
                    >
                      Save Settings
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
