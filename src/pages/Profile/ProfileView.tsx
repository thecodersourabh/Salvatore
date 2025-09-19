import {
  IonContent,
  IonPage,
  IonAvatar,
  IonIcon,
  IonSpinner,
} from "@ionic/react";
import {
  alertCircleOutline,
  locationOutline,
  mailOutline,
  phonePortraitOutline,
  globeOutline,
  qrCodeOutline,
  imageOutline,
  pencilOutline,
  saveOutline,
  heartOutline,
  chatbubbleOutline,
  shareOutline,
  personAddOutline,
} from "ionicons/icons";
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { cameraOutline } from "ionicons/icons";
import type { Profile } from "../../types/profile";
import { Navigation } from "../../components/Navigation";
import { useAuth } from "../../context/AuthContext";
import { ImageService } from "../../services/imageService";
import { UserService } from "../../services/userService";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = "",
  fullWidth = false,
}) => {
  const classes = [
    "bg-white rounded-lg shadow-lg",
    fullWidth ? "md:col-span-2" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classes}>{children}</div>;
};

export const ProfileView = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const auth = useAuth();
  const { user: currentUser, userContext } = auth;
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQRCode, setShowQRCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"cover" | "avatar" | null>(null);
  const [description, setDescription] = useState<string>('');
  const [descriptionChanged, setDescriptionChanged] = useState(false);
  const [savingDescription, setSavingDescription] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Calculate if this is the user's own profile with proper authorization checks
  const isOwnProfile = useMemo(() => {
    if (!currentUser || !user) return false;
    
    // Check if viewing own profile by URL username
    if (username) {
      return currentUser.email?.toLowerCase() === user.email?.toLowerCase();
    }
    
    // Check if accessing own profile directly
    return currentUser.email?.toLowerCase() === user.email?.toLowerCase();
  }, [currentUser, user, username]);

  // Calculate profile completion percentage
  const getProfileCompletion = (user: any): number => {
    if (!user) return 0;
    
    let completed = 0;
    
    // Basic profile checks
    const hasName = Boolean(user.name || user.given_name);
    const hasVerifiedEmail = Boolean(user.email && user.email_verified);
    const hasSector = Boolean(user.sector || user.serviceProviderProfile?.sector);
    const hasPhone = Boolean(user.phoneNumber || user.serviceProviderProfile?.phoneNumber);
    const isVerified = Boolean(user.serviceProviderProfile?.isVerified);
    
    if (hasName) completed += 20;
    if (hasVerifiedEmail) completed += 20;
    if (hasSector) completed += 20;
    if (hasPhone) completed += 20;
    if (isVerified) completed += 20;
    
    return completed;
  };

  const profileCompletion = getProfileCompletion(userContext);

  const handleImageUpload = async (type: "cover" | "avatar", file: File) => {
    if (!currentUser?.email) {
      setError('Please log in to upload images');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }
    
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Image size must be less than 5MB');
      return;
    }

    try {
      setUploading(type);
      setError(null);
      console.log(`🖼️ Starting ${type} upload:`, file.name);
      
      const username = currentUser.email.split('@')[0];
      
      // Upload image to S3 through ImageService
      const s3Key = await ImageService.uploadImage({
        username,
        file,
        folder: type === 'cover' ? 'covers' : 'profile'
      });
      
      console.log('✅ Image uploaded successfully:', s3Key);
      
      // Update user profile with new image
      await UserService.updateUser(currentUser.email, {
        [type === 'cover' ? 'coverImage' : 'avatar']: s3Key
      });
      setUser(prev => prev ? {
        ...prev,
        [type === 'cover' ? 'coverImage' : 'avatar']: s3Key
      } : null);

      console.log(`✅ ${type} update completed`);
      
    } catch (err) {
      console.error(`❌ ${type} upload failed:`, err);
      setError(`Failed to upload ${type}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      
      // Try to use base64 as fallback for immediate display
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUser(prev => prev ? {
            ...prev,
            [type === 'cover' ? 'coverImage' : 'avatar']: reader.result as string
          } : null);
        };
        reader.readAsDataURL(file);
        console.log('📷 Using base64 fallback for image');
      } catch (fallbackErr) {
        console.error('❌ Base64 fallback also failed:', fallbackErr);
      }
    } finally {
      setUploading(null);
    }
  };

  const handleFileSelect = (type: "cover" | "avatar") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleImageUpload(type, file);
      }
    };
    input.click();
  };

  // Handle description changes
  const handleDescriptionChange = (newValue: string) => {
    setDescription(newValue);
    setDescriptionChanged(true);
  };

  // Handle saving description
  const handleSaveDescription = async () => {
    if (!currentUser?.email || !description) return;

    try {
      setSavingDescription(true);
      setError(null);

      const updatedData = await UserService.updateUser(currentUser.email, {
        description: description
      });

      if (updatedData) {
        setUser(prev => prev ? { ...prev, description } : null);
        setDescriptionChanged(false);
        console.log('✅ Description updated successfully');
      }
    } catch (err) {
      console.error('❌ Failed to update description:', err);
      setError('Failed to save description. Please try again.');
    } finally {
      setSavingDescription(false);
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!username && !currentUser?.email) {
        setError('No username or email provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('Fetching profile for:', username || currentUser?.email);

        let userData;
        if (username) {
          // Fetch by username for other profiles
          userData = await UserService.getUserByUsername(username);
        } else {
          // Fetch by email for own profile
          userData = currentUser && currentUser.email ? await UserService.getUserByEmail(currentUser.email) : null;
        }

        if (userData) {
          // Process avatar URL if it exists
          let avatarUrl = userData.avatar || '';
          if (avatarUrl && !avatarUrl.startsWith('data:') && !avatarUrl.startsWith('http')) {
            avatarUrl = ImageService.getImageUrl(avatarUrl);
          }

          // Process cover image URL if it exists
          let coverImageUrl = (userData as any).coverImage || '';
          if (coverImageUrl && !coverImageUrl.startsWith('data:') && !coverImageUrl.startsWith('http')) {
            coverImageUrl = ImageService.getImageUrl(coverImageUrl);
          }

          setUser({
            ...userData,
            avatar: avatarUrl,
            coverImage: coverImageUrl
          } as Profile);

          // Initialize description state
          setDescription(userData.description || '');

          console.log('Profile loaded successfully:', {
            name: userData.name,
            email: userData.email,
            avatar: avatarUrl
          });

        } else {
          console.log('No profile found for:', username || currentUser?.email);
          setError('Profile not found');
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [username, currentUser?.email]);


  const renderProfileContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 p-4">
          <div className="max-w-md w-full space-y-6">
            <div className="text-center">
              <IonSpinner name="crescent" className="h-8 w-8 text-rose-600" />
              <p className="mt-4 text-gray-600">Loading profile...</p>
            </div>

            {isOwnProfile && userContext && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Profile Completion</h3>
                  <div className="relative w-full h-2 bg-gray-100 rounded">
                    <div
                      className="absolute left-0 top-0 h-full bg-rose-500 rounded transition-all duration-500"
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    {profileCompletion < 100 
                      ? `Your profile is ${profileCompletion}% complete` 
                      : 'Your profile is complete!'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (error || !user) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center max-w-md w-full">
            <div className="text-rose-600 mb-4">
              <IonIcon icon={alertCircleOutline} className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Error Loading Profile</h2>
            <p className="text-gray-600 mb-4">
              {error || "We couldn't load this profile. Please try again later."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen bg-gray-50">
        <div className="flex-1">
          <IonPage>
            <Navigation />
            <IonContent className="ion-content-scroll-host">
              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Profile Header Card */}
                {/* Profile Completion Alert */}
                {isOwnProfile && profileCompletion < 100 && (
                  <div className="mb-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <IonIcon
                            icon={alertCircleOutline}
                            className="h-5 w-5 text-yellow-400"
                          />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">
                            Complete Your Profile
                          </h3>
                          <div className="mt-2">
                            <div className="relative w-full h-2 bg-yellow-100 rounded">
                              <div
                                className="absolute left-0 top-0 h-full bg-yellow-400 rounded"
                                style={{ width: `${profileCompletion}%` }}
                              />
                            </div>
                            <p className="mt-2 text-sm text-yellow-700">
                              Your profile is {profileCompletion}% complete. Complete your profile to access all features.
                            </p>
                          </div>
                          <div className="mt-3">
                            <button
                              onClick={() => navigate('/profile/complete')}
                              className="text-sm font-medium text-yellow-800 hover:text-yellow-900"
                            >
                              <div 
                                onClick={() => navigate('/profile/completion')}
                                className="flex items-center space-x-1 cursor-pointer"
                              >
                                <span>Complete Now</span>
                                <span className="ml-1">→</span>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Profile Header Card */}
                <Card fullWidth className="mb-6 overflow-hidden relative h-48 bg-gradient-to-r from-rose-500 to-purple-600">
                  <div className="relative h-full">
                    {user.coverImage && (
                      <img
                        src={user.coverImage}
                        alt="Cover"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}

                    {/* Top right - Connect/Message buttons for other users' profiles */}
                    {!isOwnProfile && (
                      <div className="absolute top-4 right-4 flex items-center space-x-3 z-20">
                        <button
                          onClick={() => {/* TODO: Implement connect handler */}}
                          className="flex items-center px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shadow-lg"
                        >
                          <IonIcon icon={personAddOutline} className="h-5 w-5 mr-2" />
                          Connect
                        </button>
                        <button
                          onClick={() => {/* TODO: Implement message handler */}}
                          className="flex items-center px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-700 rounded-lg hover:bg-white transition-colors shadow-lg"
                        >
                          <IonIcon icon={chatbubbleOutline} className="h-5 w-5 mr-2" />
                          Message
                        </button>
                      </div>
                    )}

                    {/* Bottom right - Cover Management Buttons for own profile */}
                    {isOwnProfile && (
                      <div className="absolute bottom-4 right-4 flex items-center space-x-2 z-10">
                        <button
                          onClick={() => handleFileSelect("cover")}
                          className="bg-white/90 hover:bg-white backdrop-blur-sm rounded-full p-2.5 transition-all group shadow-lg"
                          disabled={uploading === "cover"}
                        >
                          {uploading === "cover" ? (
                            <IonSpinner
                              name="crescent"
                              className="h-5 w-5 text-rose-600"
                            />
                          ) : (
                            <IonIcon
                              icon={cameraOutline}
                              className="h-5 w-5 text-gray-700 group-hover:text-gray-900 group-hover:scale-110 transition-all"
                            />
                          )}
                        </button>
                        <button
                          onClick={() => setShowQRCode(true)}
                          className="bg-white/90 hover:bg-white backdrop-blur-sm rounded-full p-2.5 transition-all group shadow-lg"
                        >
                          <IonIcon
                            icon={qrCodeOutline}
                            className="h-5 w-5 text-gray-700 group-hover:text-gray-900 group-hover:scale-110 transition-all"
                          />
                        </button>
                      </div>
                    )}

                    {/* Avatar Section */}
                    <div className="absolute left-6 top-1/2 -translate-y-1/2">
                      <div className="relative">
                        <IonAvatar className="w-32 h-32 border-4 border-white rounded-full shadow-xl">
                          <img
                            src={user.avatar || '/assets/default-avatar.svg'}
                            alt=""
                            className="w-full h-full object-cover rounded-full bg-gradient-to-br from-rose-500 to-purple-600"
                          />
                        </IonAvatar>
                        <button
                          onClick={() => handleFileSelect("avatar")}
                          className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm hover:bg-white hover:shadow-md transition-all duration-200 group flex items-center justify-center w-7 h-7"
                          disabled={uploading === "avatar"}
                        >
                          {uploading === "avatar" ? (
                            <IonSpinner
                              name="crescent"
                              className="h-4 w-4 text-rose-500"
                            />
                          ) : (
                            <IonIcon
                              icon={cameraOutline}
                              className="h-4 w-4 text-gray-500/90 group-hover:text-gray-600 transition-colors duration-200"
                            />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Quick Info Card */}
                <Card fullWidth>
                  <div className="flex flex-col md:flex-row md:divide-x divide-gray-200">
                    {/* Contact */}
                    <div className="px-4 py-3 flex-1">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">
                        Contact
                      </h4>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <IonIcon
                            icon={mailOutline}
                            className="h-4 w-4 text-gray-400 mr-2"
                          />
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <IonIcon
                            icon={phonePortraitOutline}
                            className="h-4 w-4 text-gray-400 mr-2"
                          />
                          <span>{user.phone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Working Hours */}
                    <div className="px-4 py-3 flex-1 md:border-l">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">
                        Availability
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center">
                          <span className="text-green-600 mr-2">●</span>
                          <span>Available Weekdays</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <IonIcon
                            icon={globeOutline}
                            className="h-4 w-4 mr-2"
                          />
                          <span>
                            {user.availability?.hours?.start} -{" "}
                            {user.availability?.hours?.end}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Service Area */}
                    <div className="px-4 py-3 flex-1">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">
                        Service Area
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center">
                          <IonIcon
                            icon={locationOutline}
                            className="h-4 w-4 text-gray-400 mr-2"
                          />
                          <span>
                            {user.serviceAreas?.locations?.[0]?.city},{" "}
                            {user.serviceAreas?.locations?.[0]?.state}
                          </span>
                        </div>
                        {user.serviceAreas?.serviceAtHome && (
                          <div className="flex items-center text-green-600">
                            <span className="mr-1">✓</span>
                            <span>Home Service Available</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Core Skills */}
                    <div className="px-4 py-3 flex-1">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">
                        Core Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {user.skills?.slice(0, 5).map((skill, index) => (
                          <div
                            key={index}
                            className="inline-flex items-center text-sm bg-green-50 text-green-700 rounded-full px-3 py-1"
                          >
                            {skill.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Posts and Description Section */}
                <div className="mt-6 space-y-6">
                  {/* About Section */}
                  <Card fullWidth>
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">About</h3>
                        {isOwnProfile && (
                          <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="p-1.5 text-gray-500 hover:text-rose-600 rounded-full hover:bg-rose-50 transition-all duration-200"
                            title={isEditing ? "Cancel editing" : "Edit description"}
                          >
                            <IonIcon icon={pencilOutline} className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <textarea
                          className={`w-full min-h-[100px] p-3 border rounded-lg resize-none transition-colors ${
                            isEditing 
                              ? 'border-gray-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white pr-12' 
                              : 'border-transparent bg-gray-50'
                          }`}
                          placeholder={isOwnProfile ? "Tell us about yourself..." : "No description available"}
                          value={description}
                          onChange={(e) => handleDescriptionChange(e.target.value)}
                          readOnly={!isEditing}
                        />
                        {isOwnProfile && isEditing && descriptionChanged && (
                          <button
                            onClick={handleSaveDescription}
                            className="absolute right-2 bottom-2 p-2 text-gray-500 hover:text-rose-600 rounded-full hover:bg-rose-50 transition-all duration-200 bg-white shadow-sm"
                            disabled={savingDescription}
                            title="Save changes"
                          >
                            {savingDescription ? (
                              <IonSpinner name="crescent" className="h-5 w-5 text-rose-600" />
                            ) : (
                              <IonIcon icon={saveOutline} className="h-5 w-5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* Posts Section */}
                  <Card fullWidth>
                    <div className="p-6">
                      {/* Create Post */}
                      <div className="mb-6">
                        <div className="flex items-start space-x-4">
                          <IonAvatar className="w-10 h-10">
                            <img
                              src={user.avatar || '/assets/default-avatar.svg'}
                              alt=""
                              className="rounded-full"
                            />
                          </IonAvatar>
                          <div className="flex-1">
                            <textarea
                              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                              placeholder="What's on your mind?"
                              rows={3}
                            />
                            <div className="mt-3 flex justify-between items-center">
                              <div className="flex space-x-2">
                                <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 text-sm">
                                  <IonIcon icon={imageOutline} className="w-5 h-5" />
                                  <span>Photo</span>
                                </button>
                              </div>
                              <button className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors">
                                Post
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sample Post */}
                      <div className="border-t border-gray-200 pt-6">
                        <div className="flex space-x-4">
                          <IonAvatar className="w-10 h-10">
                            <img
                              src={user.avatar || '/assets/default-avatar.svg'}
                              alt=""
                              className="rounded-full"
                            />
                          </IonAvatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-gray-900">{user.name}</h4>
                              <span className="text-gray-500 text-sm">• 2h ago</span>
                            </div>
                            <p className="mt-2 text-gray-700">
                              Just completed another successful project! Looking forward to new challenges.
                            </p>
                            <div className="mt-4">
                              <img
                                src="https://placehold.co/600x400"
                                alt=""
                                className="rounded-lg w-full"
                              />
                            </div>
                            <div className="mt-4 flex items-center space-x-4">
                              <button className="flex items-center space-x-2 text-gray-600 hover:text-rose-600">
                                <IonIcon icon={heartOutline} className="w-5 h-5" />
                                <span>123 Likes</span>
                              </button>
                              <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-800">
                                <IonIcon icon={chatbubbleOutline} className="w-5 h-5" />
                                <span>45 Comments</span>
                              </button>
                              <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-800">
                                <IonIcon icon={shareOutline} className="w-5 h-5" />
                                <span>Share</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </main>
            </IonContent>
          </IonPage>
        </div>

        {/* QR Code Modal */}
        {showQRCode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold">Profile QR Code</h3>
                <p className="text-sm text-gray-600">Scan to view profile</p>
              </div>
              <div className="flex justify-center mb-4">
                <QRCodeSVG
                  value={window.location.href}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <button
                onClick={() => setShowQRCode(false)}
                className="w-full px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return renderProfileContent();
5};
