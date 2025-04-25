import { cn } from "@/lib/utils";
import { useState } from "react";

interface YoutubeEmbedProps {
  videoId: string;
  title?: string;
  className?: string;
  previewMode?: boolean;
  thumbnailOnly?: boolean;
  onPlay?: () => void;
}

export function YoutubeEmbed({
  videoId,
  title = "YouTube video player",
  className,
  previewMode = false,
  thumbnailOnly = false,
  onPlay,
}: YoutubeEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Extract video ID from full URL if provided instead of just the ID
  const extractVideoId = (input: string): string => {
    // Handle youtu.be URLs
    if (input.includes('youtu.be/')) {
      const id = input.split('youtu.be/')[1];
      return id.split('?')[0];
    }
    
    // Handle youtube.com URLs
    if (input.includes('v=')) {
      const params = new URLSearchParams(input.split('?')[1]);
      return params.get('v') || input;
    }
    
    // If it's already just an ID
    return input;
  };
  
  const cleanVideoId = extractVideoId(videoId);
  
  const handlePlayClick = () => {
    if (thumbnailOnly) return;
    
    setIsPlaying(true);
    if (onPlay) onPlay();
  };
  
  if (thumbnailOnly || (previewMode && !isPlaying)) {
    return (
      <div 
        className={cn(
          "relative pb-[56.25%] h-0 bg-gray-100 rounded-md overflow-hidden", 
          className
        )}
      >
        <img 
          src={`https://img.youtube.com/vi/${cleanVideoId}/maxresdefault.jpg`}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            // Fallback to mqdefault if maxresdefault is not available
            (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${cleanVideoId}/mqdefault.jpg`;
          }}
        />
        {!thumbnailOnly && (
          <div 
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            onClick={handlePlayClick}
          >
            <div className="bg-red-600 text-white rounded-full w-16 h-16 flex items-center justify-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <polygon points="10 8 16 12 10 16 10 8"></polygon>
              </svg>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className={cn("relative pb-[56.25%] h-0", className)}>
      <iframe
        className="absolute inset-0 w-full h-full rounded-md"
        src={`https://www.youtube.com/embed/${cleanVideoId}?autoplay=${isPlaying ? '1' : '0'}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
}
