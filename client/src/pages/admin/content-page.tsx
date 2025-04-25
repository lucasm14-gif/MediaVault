import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Photo, Video, Client, InsertPhoto, InsertVideo } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout";
import { FileInput } from "@/components/ui/file-input";
import { YoutubeEmbed } from "@/components/ui/youtube-embed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Eye, 
  ImagePlus, 
  Pencil, 
  Search, 
  Trash2, 
  Video as VideoIcon
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDate, extractYouTubeID } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const photoFormSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  clientId: z.string().min(1, "Please select a client"),
  description: z.string().optional(),
});

const videoFormSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  clientId: z.string().min(1, "Please select a client"),
  youtubeUrl: z
    .string()
    .min(1, "Please enter a YouTube URL")
    .refine(
      (url) => extractYouTubeID(url) !== null,
      "Please enter a valid YouTube URL"
    ),
  description: z.string().optional(),
});

type PhotoFormValues = z.infer<typeof photoFormSchema>;
type VideoFormValues = z.infer<typeof videoFormSchema>;

export default function ContentPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("photos");
  const [showUploadPhotoDialog, setShowUploadPhotoDialog] = useState(false);
  const [showEmbedVideoDialog, setShowEmbedVideoDialog] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [showDeletePhotoDialog, setShowDeletePhotoDialog] = useState(false);
  const [showDeleteVideoDialog, setShowDeleteVideoDialog] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const photoForm = useForm<PhotoFormValues>({
    resolver: zodResolver(photoFormSchema),
    defaultValues: {
      title: "",
      clientId: "",
      description: "",
    },
  });

  const videoForm = useForm<VideoFormValues>({
    resolver: zodResolver(videoFormSchema),
    defaultValues: {
      title: "",
      clientId: "",
      youtubeUrl: "",
      description: "",
    },
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: photos, isLoading: isLoadingPhotos } = useQuery<Photo[]>({
    queryKey: ["/api/photos"],
  });

  const { data: videos, isLoading: isLoadingVideos } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (data: {
      formData: PhotoFormValues;
      files: File[];
    }) => {
      const { formData, files } = data;
      
      // Create FormData object for file upload
      const form = new FormData();
      form.append("title", formData.title);
      form.append("clientId", formData.clientId);
      if (formData.description) {
        form.append("description", formData.description);
      }
      
      // Append all files
      files.forEach((file) => {
        form.append("photos", file);
      });
      
      const response = await fetch("/api/photos", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to upload photo");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      toast({
        title: "Success",
        description: "Photos uploaded successfully",
      });
      setShowUploadPhotoDialog(false);
      photoForm.reset();
      setSelectedFiles([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const embedVideoMutation = useMutation({
    mutationFn: async (data: VideoFormValues) => {
      const videoData: InsertVideo = {
        title: data.title,
        clientId: parseInt(data.clientId),
        youtubeUrl: data.youtubeUrl,
        description: data.description || "",
      };
      
      const res = await apiRequest("POST", "/api/videos", videoData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: "Success",
        description: "Video embedded successfully",
      });
      setShowEmbedVideoDialog(false);
      videoForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/photos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      toast({
        title: "Success",
        description: "Photo deleted successfully",
      });
      setShowDeletePhotoDialog(false);
      setSelectedPhoto(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/videos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: "Success",
        description: "Video deleted successfully",
      });
      setShowDeleteVideoDialog(false);
      setSelectedVideo(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmitPhoto = (data: PhotoFormValues) => {
    if (selectedFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one photo to upload",
        variant: "destructive",
      });
      return;
    }
    
    uploadPhotoMutation.mutate({
      formData: data,
      files: selectedFiles,
    });
  };

  const onSubmitVideo = (data: VideoFormValues) => {
    embedVideoMutation.mutate(data);
  };

  const handleDeletePhoto = (photo: Photo) => {
    setSelectedPhoto(photo);
    setShowDeletePhotoDialog(true);
  };

  const handleDeleteVideo = (video: Video) => {
    setSelectedVideo(video);
    setShowDeleteVideoDialog(true);
  };

  const confirmDeletePhoto = () => {
    if (selectedPhoto) {
      deletePhotoMutation.mutate(selectedPhoto.id);
    }
  };

  const confirmDeleteVideo = () => {
    if (selectedVideo) {
      deleteVideoMutation.mutate(selectedVideo.id);
    }
  };

  // Filter photos based on search query and client filter
  const filteredPhotos = photos
    ? photos.filter((photo) => {
        const matchesSearch =
          searchQuery === "" ||
          photo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (photo.description &&
            photo.description.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesClient =
          clientFilter === "all" || photo.clientId.toString() === clientFilter;
        
        return matchesSearch && matchesClient;
      })
    : [];

  // Filter videos based on search query and client filter
  const filteredVideos = videos
    ? videos.filter((video) => {
        const matchesSearch =
          searchQuery === "" ||
          video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (video.description &&
            video.description.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesClient =
          clientFilter === "all" || video.clientId.toString() === clientFilter;
        
        return matchesSearch && matchesClient;
      })
    : [];

  return (
    <AdminLayout title="Content">
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center flex-wrap gap-3">
          <h2 className="text-lg font-medium text-gray-800">Content Management</h2>
          <div className="flex space-x-3">
            <Button onClick={() => setShowUploadPhotoDialog(true)}>
              <ImagePlus className="h-4 w-4 mr-2" />
              Upload Photo
            </Button>
            <Button 
              onClick={() => setShowEmbedVideoDialog(true)}
              variant="secondary"
              className="bg-accent text-white hover:bg-purple-600"
            >
              <VideoIcon className="h-4 w-4 mr-2" />
              Embed Video
            </Button>
          </div>
        </div>

        <div className="px-6 py-4">
          <Tabs
            defaultValue="photos"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="videos">Videos</TabsTrigger>
            </TabsList>

            <div className="flex justify-between items-center mt-6 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={`Search ${activeTab}...`}
                  className="pl-10 pr-4 w-full md:w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex space-x-3">
                <Select
                  value={clientFilter}
                  onValueChange={setClientFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value="photos" className="mt-6">
              {isLoadingPhotos ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array(8)
                    .fill(0)
                    .map((_, index) => (
                      <ContentSkeleton key={index} />
                    ))}
                </div>
              ) : filteredPhotos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
                    >
                      <div className="relative group">
                        <img
                          src={photo.url}
                          alt={photo.title}
                          className="w-full h-40 object-cover object-center transition"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="rounded-full w-8 h-8 p-0"
                            onClick={() => window.open(photo.url, "_blank")}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="rounded-full w-8 h-8 p-0"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="rounded-full w-8 h-8 p-0 bg-red-500 hover:bg-red-600 text-white"
                            onClick={() => handleDeletePhoto(photo)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="text-sm font-medium text-gray-800 truncate">
                          {photo.title}
                        </h3>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-gray-500">
                            {clients?.find((c) => c.id === photo.clientId)?.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(photo.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ImagePlus className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No photos found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchQuery || clientFilter !== "all"
                      ? "Try adjusting your search or filter"
                      : "Get started by uploading a photo"}
                  </p>
                  {!searchQuery && clientFilter === "all" && (
                    <Button
                      className="mt-4"
                      onClick={() => setShowUploadPhotoDialog(true)}
                    >
                      <ImagePlus className="h-4 w-4 mr-2" />
                      Upload Photo
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="videos" className="mt-6">
              {isLoadingVideos ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array(6)
                    .fill(0)
                    .map((_, index) => (
                      <ContentSkeleton key={index} isVideo />
                    ))}
                </div>
              ) : filteredVideos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredVideos.map((video) => (
                    <div
                      key={video.id}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
                    >
                      <div className="relative group">
                        <YoutubeEmbed
                          videoId={video.youtubeUrl}
                          previewMode
                          className="w-full"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="rounded-full w-8 h-8 p-0"
                            onClick={() => window.open(`https://www.youtube.com/watch?v=${extractYouTubeID(video.youtubeUrl)}`, "_blank")}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="rounded-full w-8 h-8 p-0"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="rounded-full w-8 h-8 p-0 bg-red-500 hover:bg-red-600 text-white"
                            onClick={() => handleDeleteVideo(video)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="text-sm font-medium text-gray-800 truncate">
                          {video.title}
                        </h3>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-gray-500">
                            {clients?.find((c) => c.id === video.clientId)?.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(video.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <VideoIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No videos found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchQuery || clientFilter !== "all"
                      ? "Try adjusting your search or filter"
                      : "Get started by embedding a video"}
                  </p>
                  {!searchQuery && clientFilter === "all" && (
                    <Button
                      className="mt-4 bg-accent text-white hover:bg-purple-600"
                      onClick={() => setShowEmbedVideoDialog(true)}
                    >
                      <VideoIcon className="h-4 w-4 mr-2" />
                      Embed Video
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Upload Photo Dialog */}
      <Dialog open={showUploadPhotoDialog} onOpenChange={setShowUploadPhotoDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Upload Photo</DialogTitle>
            <DialogDescription>
              Upload photos to a client's repository.
            </DialogDescription>
          </DialogHeader>

          <Form {...photoForm}>
            <form 
              onSubmit={photoForm.handleSubmit(onSubmitPhoto)}
              className="space-y-4"
            >
              <FormField
                control={photoForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Photo Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter photo title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={photoForm.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients?.map((client) => (
                            <SelectItem
                              key={client.id}
                              value={client.id.toString()}
                            >
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={photoForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter a short description"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="mb-4">
                <FileInput
                  onFilesSelected={setSelectedFiles}
                  accept="image/*"
                  multiple
                  label="Upload Photos"
                  description="Drag and drop photos here or click to browse"
                  maxSize={10}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUploadPhotoDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={uploadPhotoMutation.isPending}
                  disabled={selectedFiles.length === 0}
                >
                  Upload Photo
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Embed Video Dialog */}
      <Dialog open={showEmbedVideoDialog} onOpenChange={setShowEmbedVideoDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Embed YouTube Video</DialogTitle>
            <DialogDescription>
              Embed a YouTube video to a client's repository.
            </DialogDescription>
          </DialogHeader>

          <Form {...videoForm}>
            <form 
              onSubmit={videoForm.handleSubmit(onSubmitVideo)}
              className="space-y-4"
            >
              <FormField
                control={videoForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter video title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={videoForm.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients?.map((client) => (
                            <SelectItem
                              key={client.id}
                              value={client.id.toString()}
                            >
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={videoForm.control}
                name="youtubeUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>YouTube Video URL or ID</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://www.youtube.com/watch?v=..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Paste a YouTube URL or video ID
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={videoForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter a short description"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {videoForm.watch("youtubeUrl") && extractYouTubeID(videoForm.watch("youtubeUrl")) && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Preview:</p>
                  <YoutubeEmbed 
                    videoId={videoForm.watch("youtubeUrl")}
                    thumbnailOnly
                  />
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEmbedVideoDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={embedVideoMutation.isPending}
                  className="bg-accent hover:bg-purple-600"
                >
                  Embed Video
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Photo Confirmation Dialog */}
      <AlertDialog 
        open={showDeletePhotoDialog} 
        onOpenChange={setShowDeletePhotoDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this photo? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDeletePhoto}
              disabled={deletePhotoMutation.isPending}
            >
              {deletePhotoMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Video Confirmation Dialog */}
      <AlertDialog 
        open={showDeleteVideoDialog} 
        onOpenChange={setShowDeleteVideoDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this video? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDeleteVideo}
              disabled={deleteVideoMutation.isPending}
            >
              {deleteVideoMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

function ContentSkeleton({ isVideo = false }: { isVideo?: boolean }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <Skeleton className={`w-full ${isVideo ? 'h-40 pb-[56.25%]' : 'h-40'}`} />
      <div className="p-3">
        <Skeleton className="h-5 w-full mb-2" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
    </div>
  );
}
