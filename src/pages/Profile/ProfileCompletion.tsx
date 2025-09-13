import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStep } from '../../context/StepContext';
import { useLocation } from '../../hooks/useLocation';
import { camera } from 'ionicons/icons';
import './ProfileCompletion.css';
import {
  IonContent,
  IonText,
  IonSpinner,
  IonAlert,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon
} from '@ionic/react';
import { UserService } from '../../services/userService';
import { ImageService } from '../../services/imageService';
import { ServiceSector } from '../../types/user';


export const ProfileCompletion = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const { user } = auth;
  const { currentStep, nextStep, previousStep, canGoNext, canGoPrevious } = useStep();
  const [, setLoading] = useState(true);
  const { requestPermission, getCurrentLocationWithAddress, permissionStatus, locationData } = useLocation();

  // Form state
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState<number | null>(null); // Track which location is being fetched
  const [uploadingImage, setUploadingImage] = useState(false);
  const [userImages, setUserImages] = useState<Array<{
    key: string;
    url: string;
    size?: number;
    lastModified?: string;
  }>>([]);
  
  const handleGetCurrentLocation = async (locationIndex: number) => {
    try {
      setGettingLocation(locationIndex);
      setError(null);
      
      // Request permission if not granted
      if (!permissionStatus?.granted) {
        await requestPermission();
      }
      
      // Get current location with address
      await getCurrentLocationWithAddress();
      
      if (locationData) {
        // Update the specific location with coordinates and address
        const newLocations = [...formData.serviceAreas.locations];
        newLocations[locationIndex] = {
          ...newLocations[locationIndex],
          city: locationData.address?.city || '',
          state: locationData.address?.state || '',
          country: locationData.address?.country || '',
          coordinates: {
            latitude: locationData.latitude,
            longitude: locationData.longitude
          }
        };
        
        setFormData(prev => ({
          ...prev,
          serviceAreas: { ...prev.serviceAreas, locations: newLocations }
        }));
        
        console.log('✅ Location updated with address:', locationData);
      }
    } catch (err) {
      console.error('❌ Failed to get location:', err);
      setError(`Failed to get location: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setGettingLocation(null);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }
    
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Image size must be less than 5MB');
      return;
    }
    
    if (!user?.email) {
      setError('User email not found. Please log in again.');
      return;
    }
    
    try {
      setUploadingImage(true);
      setError(null);
      console.log('🖼️ Starting image upload:', file.name);
      
      // Use username or email as the identifier
      const username = formData.userName || user.email.split('@')[0];
      
      // Upload image to S3
      const s3Key = await ImageService.uploadImage({
        username,
        file,
        folder: 'profile'
      });
      
      console.log('✅ Image uploaded successfully:', s3Key);
      
      // Update form data with the S3 key - getCdnUrl will be used for display
      setFormData(prev => ({
        ...prev,
        avatar: s3Key
      }));
      
      // Refresh user images list
      await loadUserImages(username);
      
      console.log('✅ Image upload completed and form updated');
      
    } catch (err) {
      console.error('❌ Image upload failed:', err);
      setError(`Failed to upload image: ${err instanceof Error ? err.message : 'Unknown error'}`);
      
      // Try to fetch the file directly from CDN if possible
      try {
        // Just use base64 encoding as fallback
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({
            ...prev,
            avatar: reader.result as string
          }));
        };
        reader.readAsDataURL(file);
        console.log('📷 Using base64 fallback for image');
      } catch (fallbackErr) {
        console.error('❌ Base64 fallback also failed:', fallbackErr);
      }
    } finally {
      setUploadingImage(false);
    }
  };

  // Load user images from server
  const loadUserImages = async (username?: string) => {
    if (!username && !user?.email) return;
    
    try {
      const userIdentifier = username || formData.userName || user!.email.split('@')[0];
      const response = await ImageService.listImages(userIdentifier, 'profile');
      
      // Use images directly from the response, they already have the right URL format
      const images = response.images || [];
      setUserImages(images);
      
      // If the current avatar is a key, find and set its URL
      if (formData.avatar && !formData.avatar.startsWith('http')) {
        const avatarImage = images.find(img => img.key === formData.avatar);
        if (avatarImage) {
          setFormData(prev => ({
            ...prev,
            avatar: avatarImage.key // Store the key, we'll use it to look up the URL when displaying
          }));
        }
      }
      
      console.log('📋 Loaded user images:', images.length);
    } catch (err) {
      console.error('❌ Failed to load user images:', err);
      // Don't show error to user for this, it's not critical
    }
  };

  // Delete an image
  const handleDeleteImage = async (imageKey: string) => {
    try {
      await ImageService.deleteImage(imageKey);
      console.log('🗑️ Image deleted successfully:', imageKey);
      
      // Remove from local state
      setUserImages(prev => prev.filter(img => img.key !== imageKey));
      
      // If this was the current avatar, clear it
      if (formData.avatar && (formData.avatar.includes(imageKey) || formData.avatar === ImageService.getImageUrl(imageKey))) {
        setFormData(prev => ({ ...prev, avatar: '' }));
      }
    } catch (err) {
      console.error('❌ Failed to delete image:', err);
      setError(`Failed to delete image: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Select an existing image as avatar
  const handleSelectImage = (key: string) => {
    // Store the image key in formData
    setFormData(prev => ({ ...prev, avatar: key }));
    console.log('🖼️ Selected image as avatar:', key);
  };

  type Skill = {
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    yearsOfExperience: number;
  };

  type Location = {
    city: string;
    state: string;
    country: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };

  type FormDataType = {
    name: string;
    userName: string;
    sector: string;
    phoneNumber: string;
    avatar: string;
    skills: Skill[];
    availability: {
      weekdays: boolean;
      weekends: boolean;
      hours: {
        start: string;
        end: string;
      };
    };
    serviceAreas: {
      locations: Location[];
      serviceAtHome: boolean;
      serviceAtWorkshop: boolean;
      radius: number;
      unit: 'km' | 'mi';
    };
    pricing: {
      model: 'hourly' | 'fixed' | 'project';
      baseRate: number;
      currency: string;
      minimumCharge: number;
      travelFee: number;
      servicePackages: string[];
    };
  };

  const [formData, setFormData] = useState<FormDataType>({
    // Basic Info
    name: user?.name || '',
    userName:  '',
    sector: user?.sector || '',
    phoneNumber: user?.phoneNumber || '',
    avatar: user?.avatar || '',

    // Skills
    skills: [],
    // Availability
    availability: {
      weekdays: true,
      weekends: false,
      hours: {
        start: '09:00',
        end: '17:00'
      }
    },
    
    // Service Areas
    serviceAreas: {
      locations: [],
      serviceAtHome: true,
      serviceAtWorkshop: false,
      radius: 50,
      unit: 'km'
    },
    
    // Pricing
    pricing: {
      model: 'hourly',
      baseRate: 0,
      currency: 'USD',
      minimumCharge: 0,
      travelFee: 0,
      servicePackages: []
    }
  });

   // Debug renders
  useEffect(() => {
    console.log('ProfileCompletion rendered:', {
      currentStep,
      userEmail: user?.email,
      canGoNext,
      canGoPrevious
    });
  }, [currentStep, user?.email, canGoNext, canGoPrevious]);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.email) return;
      
      setLoading(true);
      try {
        const userData = await UserService.getUserByEmail(user.email);
        if (userData) {
          setFormData(prev => ({
            ...prev,
            name: userData.name || prev.name,
            userName: userData.userName || prev.userName,
            avatar: userData.avatar || prev.avatar,
            sector: userData.sector || prev.sector,
            phoneNumber: userData.phone || prev.phoneNumber,
            skills: userData.skills || prev.skills,
            availability: userData.availability || prev.availability,
            serviceAreas: {
              ...prev.serviceAreas,
              locations: userData.serviceAreas?.locations || prev.serviceAreas.locations,
              serviceAtHome: userData.preferences?.serviceAtHome ?? prev.serviceAreas.serviceAtHome,
              serviceAtWorkshop: userData.preferences?.serviceAtWorkshop ?? prev.serviceAreas.serviceAtWorkshop,
            },
            pricing: userData.pricing || prev.pricing // Keep default pricing as it's not in the User type
          }));
          console.log('Loaded user data:', userData);
        }
      } catch (err) {
        console.error('Failed to load user data:', err);
        setError('Failed to load user data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user?.email]);

  useEffect(() => {
    console.log('Step changed to:', currentStep);
    
    // Initialize service areas step with a default location if empty
    if (currentStep === 3 && formData.serviceAreas.locations.length === 0) {
      setFormData(prev => ({
        ...prev,
        serviceAreas: {
          ...prev.serviceAreas,
          locations: [
            {
              city: '',
              state: '',
              country: '',
              coordinates: { latitude: 0, longitude: 0 }
            }
          ]
        }
      }));
    }
    
    // Initialize skills step with a default skill if empty
    if (currentStep === 1 && formData.skills.length === 0) {
      console.log('🔧 Initializing skills step with default skill');
      setFormData(prev => ({
        ...prev,
        skills: [
          {
            name: '',
            level: 'beginner',
            yearsOfExperience: 0
          }
        ]
      }));
    }
  }, [currentStep, formData.serviceAreas.locations.length, formData.skills.length]);

  useEffect(() => {
    console.log('📊 Form data updated:', {
      step: currentStep,
      skillsCount: formData.skills.length,
      skills: formData.skills,
      locationsCount: formData.serviceAreas.locations.length
    });
  }, [formData, currentStep]);

  useEffect(() => {
    console.log('Error state changed:', error);
  }, [error]);

  useEffect(() => {
    console.log('Saving state changed:', saving);
  }, [saving]);

  // Load user images when username or email changes
  useEffect(() => {
    if (user?.email && (formData.userName || user.email)) {
      const username = formData.userName || user.email.split('@')[0];
      loadUserImages(username);
    }
  }, [user?.email, formData.userName]);

  const validateStep = () => {
    console.log('=== validateStep START ===');
    console.log('Validating step:', currentStep);
    console.log('Current form data:', formData);
    
    try {
      let isValid = true;
      
      switch (currentStep) {
        case 0:
          console.log('Validating basic info step');
          if (!formData.name?.trim()) {
            console.log('Name validation failed');
            setError('Please enter your name');
            isValid = false;
          }
          if (!formData.sector) {
            console.log('Sector validation failed');
            setError('Please select a sector');
            isValid = false;
          }
          if (!formData.phoneNumber?.trim()) {
            console.log('Phone number validation failed');
            setError('Please enter your phone number');
            isValid = false;
          }
          console.log('Basic info validation result:', isValid);
          return isValid;

        case 1:
          console.log('Validating skills step');
          console.log('Current skills data:', formData.skills);
          if (formData.skills.length === 0) {
            console.log('❌ Validation failed: No skills added');
            setError('Please add at least one skill');
            return false;
          }
          if (formData.skills.some(skill => !skill.name?.trim())) {
            console.log('❌ Validation failed: Empty skill names found');
            setError('Please fill in all skill names');
            return false;
          }
          console.log('✅ Skills validation passed');
          return true;

        case 2:
          console.log('Validating availability step');
          if (!formData.availability.hours.start || !formData.availability.hours.end) {
            setError('Please set your working hours');
            return false;
          }
          console.log('Availability validation passed');
          return true;

        case 3:
          console.log('Validating service areas step');
          if (formData.serviceAreas.locations.length === 0) {
            setError('Please add at least one service location');
            return false;
          }
          if (formData.serviceAreas.locations.some(loc => !loc.city?.trim() || !loc.state?.trim() || !loc.country?.trim())) {
            setError('Please fill in all location details');
            return false;
          }
          console.log('Service areas validation passed');
          return true;

        case 4:
          console.log('Validating pricing step', formData.pricing);
          if (!formData.pricing.model) {
            console.log('❌ Validation failed: No pricing model selected');
            setError('Please select a pricing model');
            return false;
          }
          if (formData.pricing.baseRate <= 0) {
            console.log('❌ Validation failed: Invalid base rate', formData.pricing.baseRate);
            setError('Please enter a valid base rate');
            return false;
          }
          if (!formData.pricing.currency) {
            console.log('❌ Validation failed: No currency selected');
            setError('Please select a currency');
            return false;
          }
          console.log('✅ Pricing validation passed');
          return true;

        default:
          console.log('Unknown step:', currentStep);
          return false;
      }
    } catch (error) {
      console.error('Validation error:', error);
      setError('An error occurred during validation');
      return false;
    }
  };

  const handleSubmit = async (isPartialSave: boolean = false) => {
    if (!user?.email) {
      setError('User email not found. Please log in again.');
      return false;
    }

    if (!isPartialSave && !validateStep()) {
      console.log('❌ Final validation failed');
      return false;
    }

    setSaving(true);
    setError(null);

    try {
      let dataToUpdate: any = {};
      
      // Only send the relevant data based on the current step
      switch (currentStep) {
        case 0:
          dataToUpdate = {
            displayName: formData.name,
            userName: formData.userName,
            sector: formData.sector as ServiceSector,
            phone: formData.phoneNumber,
            avatar: formData.avatar
          };
          console.log('📤 Submitting basic info data:', dataToUpdate);
          break;
        case 1:
          dataToUpdate = {
            skills: formData.skills
          };
          console.log('📤 Submitting skills data:', formData.skills);
          break;
        case 2:
          dataToUpdate = {
            availability: formData.availability
          };
          break;
        case 3:
          dataToUpdate = {
            serviceAreas: formData.serviceAreas
          };
          break;
        case 4:
          // On final step, send all data
          dataToUpdate = {
            displayName: formData.name,
            userName: formData.userName,
            sector: formData.sector as ServiceSector,
            phone: formData.phoneNumber,
            avatar: formData.avatar,
            skills: formData.skills,
            availability: formData.availability,
            serviceAreas: formData.serviceAreas,
            pricing: formData.pricing
          };
          console.log('📤 Submitting complete profile data:', dataToUpdate);
          break;
      }

      console.log(`📤 Submitting ${isPartialSave ? 'partial' : 'complete'} profile data:`, dataToUpdate);
      const updatedProfile = await UserService.updateUser(user.email, dataToUpdate);

      if (updatedProfile) {
        console.log('✅ Profile updated successfully');
        if (!isPartialSave && currentStep === 4) {
          navigate('/');
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('❌ Profile update failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const sectors = [
    { id: 'Technology', name: 'Technology', icon: '💻' },
    { id: 'Engineering', name: 'Engineering', icon: '🔧' },
    { id: 'electrician', name: 'Electrician', icon: '⚡' },
    { id: 'plumber', name: 'Plumber', icon: '🔧' },
    { id: 'tailor', name: 'Tailor', icon: '✂️' },
    { id: 'mechanic', name: 'Mechanic', icon: '🔧' },
    { id: 'carpenter', name: 'Carpenter', icon: '🔨' },
    { id: 'painter', name: 'Painter', icon: '🖌️' },
    { id: 'gardener', name: 'Gardener', icon: '🌳' },
    { id: 'cleaner', name: 'Cleaner', icon: '🧹' }
  ];

  if (!user) {
    return (
      <IonContent className="min-h-screen h-full w-full" style={{ '--offset-top': '0px', '--offset-bottom': '0px' }}>
        <div className="flex justify-center items-center h-full w-full">
          <p>Please log in to continue</p>
        </div>
      </IonContent>
    );
  }

  return (
    <IonContent className="ion-padding min-h-screen h-full w-full" style={{ '--offset-top': '0px', '--offset-bottom': '0px' }}>
      <div className="max-w-4xl mx-auto w-full h-full">
        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800">Complete Your Profile</h2>
          <p className="text-sm text-gray-600">Step {currentStep + 1} of 5</p>
        </div>

      <div className="space-y-4">
              {/* Step Progress */}
              <div className="flex justify-between items-center mb-8 px-1 sm:px-2 md:px-4 overflow-x-auto">
                {['Basic Info', 'Skills', 'Availability', 'Service Areas', 'Pricing'].map((step, index) => {
                  // Calculate step state
                  const isComplete = index < currentStep;
                  const isCurrent = index === currentStep;
                  
                  const handleStepClick = async () => {
                    if (index === currentStep) return;
                    
                    // If moving away from current step, validate and save
                    if (currentStep >= 0) {
                      if (!validateStep()) {
                        console.log('❌ Current step validation failed');
                        return;
                      }
                      const saved = await handleSubmit(true);
                      if (!saved) {
                        setError('Failed to save current step data. Please try again.');
                        return;
                      }
                    }
                    
                    // Navigate to the selected step
                    if (index < currentStep) {
                      // Going backwards
                      for (let i = currentStep; i > index; i--) {
                        previousStep();
                      }
                    } else if (index > currentStep) {
                      // Going forwards
                      for (let i = currentStep; i < index; i++) {
                        nextStep();
                      }
                    }
                  };
                  
                  return (
                    <div 
                      key={step} 
                      className="flex flex-col items-center flex-1 min-w-[60px] px-1 cursor-pointer hover:opacity-80"
                      onClick={handleStepClick}
                    >
                      {/* Step indicator */}
                      <div className={`
                        w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 xl:w-10 xl:h-10 
                        text-xs sm:text-sm md:text-base
                        rounded-full flex items-center justify-center transition-all duration-200
                        ${isComplete ? 'bg-rose-600 text-white' : 
                          isCurrent ? 'border-[1.5px] sm:border-2 border-rose-600 text-rose-600' : 
                          'border-[1.5px] sm:border-2 border-gray-300 text-gray-400 hover:border-rose-400 hover:text-rose-400'}
                      `}>
                        {isComplete ? '✓' : index + 1}
                      </div>
                      
                      {/* Step label */}
                      <span className={`text-[8px] sm:text-[10px] md:text-xs mt-1 sm:mt-2 font-medium text-center whitespace-nowrap ${
                        isComplete ? 'text-rose-600' :
                        isCurrent ? 'text-rose-600' :
                        'text-gray-400 hover:text-rose-400'
                      }`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Step Content */}
              {currentStep === 0 && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Step indicator */}
                  <div className="text-center mb-4">
                    <p className="text-sm text-gray-600">Step {currentStep + 1} of 5</p>
                  </div>
                  {/* Profile Picture */}
                  <div className="space-y-4 p-3 sm:p-4 pb-6 border rounded-lg bg-white shadow-sm">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Profile Picture</h4>
                    
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="profile-image-container">
                        {userImages.length > 0 ? (
                          <>
                            <img
                              src={formData.avatar ? userImages.find(img => img.key === formData.avatar)?.url : (userImages[0]?.url || '')}
                              alt="Profile"
                              className="profile-image animate__animated animate__fadeIn"
                            />
                            <div className="profile-image-overlay">
                              <div className="flex items-center space-x-2">
                                {userImages.map((image, index) => (
                                  <div
                                    key={index}
                                    className={`w-2 h-2 rounded-full cursor-pointer transition-all duration-200 ${
                                      formData.avatar === image.key
                                        ? 'bg-white'
                                        : 'bg-white/50 hover:bg-white/75'
                                    }`}
                                    onClick={() => handleSelectImage(image.key)}
                                  />
                                ))}
                              </div>
                              <div className="absolute bottom-2 right-2 flex space-x-2">
                                <IonButton 
                                  fill="clear" 
                                  onClick={() => document.getElementById('imageUpload')?.click()}
                                  className="image-upload-button"
                                  disabled={uploadingImage}
                                >
                                  {uploadingImage ? (
                                    <IonSpinner />
                                  ) : (
                                    <IonIcon slot="icon-only" icon={camera} size="small" />
                                  )}
                                </IonButton>
                                {formData.avatar && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const currentImage = userImages.find(
                                        img => img.key === formData.avatar
                                      );
                                      if (currentImage) {
                                        handleDeleteImage(currentImage.key);
                                      }
                                    }}
                                    className="bg-red-500/75 hover:bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors"
                                    title="Delete current image"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="profile-image-placeholder">
                            <IonButton 
                              fill="clear" 
                              onClick={() => document.getElementById('imageUpload')?.click()}
                              className="image-upload-button"
                              disabled={uploadingImage}
                            >
                              {uploadingImage ? (
                                <>
                                  <IonSpinner slot="start" />
                                  <IonText color="medium">Uploading...</IonText>
                                </>
                              ) : (
                                <>
                                  <IonIcon slot="start" icon={camera} />
                                  <IonText color="medium">Upload Profile Picture</IonText>
                                </>
                              )}
                            </IonButton>
                          </div>
                        )}
                      </div>
                      
                      <input
                        type="file"
                        id="imageUpload"
                        hidden
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />

                      {/* Upload progress indicator */}
                      {uploadingImage && (
                        <div className="text-center">
                          <IonText color="medium">
                            <small>Uploading image to server...</small>
                          </IonText>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="space-y-4 p-3 sm:p-4 pb-6 border rounded-lg bg-white shadow-sm">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Personal Information</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <IonInput
                        value={formData.name}
                        label="Name"
                        labelPlacement="floating"
                        className="w-full"
                        onIonChange={e => setFormData(prev => ({ ...prev, name: e.detail.value! }))}
                        placeholder="Enter your name"
                        required
                      />
                      
                      <IonInput
                        value={formData.userName}
                        label="User Name"
                        labelPlacement="floating"
                        className="w-full"
                        onIonChange={e => setFormData(prev => ({ ...prev, userName: e.detail.value! }))}
                        placeholder="Enter your user name"
                        required
                      />
                      
                      <IonSelect
                        value={formData.sector}
                        label="Service Sector"
                        labelPlacement="floating"
                        className="w-full"
                        onIonChange={e => setFormData(prev => ({ ...prev, sector: e.detail.value }))}
                        placeholder="Select your sector"
                      >
                        {sectors.map(sector => (
                          <IonSelectOption key={sector.id} value={sector.id}>
                            {sector.icon} {sector.name}
                          </IonSelectOption>
                        ))}
                      </IonSelect>
                    
                      <IonInput
                        type="tel"
                        label="Phone Number"
                        labelPlacement="floating"
                        value={formData.phoneNumber}
                        className="w-full"
                        onIonChange={e => setFormData(prev => ({ ...prev, phoneNumber: e.detail.value! }))}
                        placeholder="Enter your phone number"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Step indicator */}
                  <div className="text-center mb-4">
                    <p className="text-sm text-gray-600">Step {currentStep + 1} of 5</p>
                  </div>
                  {/* Skills List */}
                  {formData.skills.map((skill, index) => (
                    <div key={index} className="space-y-4 p-3 sm:p-4 pb-6 border rounded-lg bg-white shadow-sm">
                      {/* Skill Header */}
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-700">Skill {index + 1}</h4>
                        <IonButton
                          size="small"
                          color="danger"
                          fill="outline"
                          onClick={() => {
                            const newSkills = formData.skills.filter((_, i) => i !== index);
                            setFormData(prev => ({ ...prev, skills: newSkills }));
                          }}
                        >
                          Remove
                        </IonButton>
                      </div>

                      {/* Skill Fields - Stack on mobile, grid on larger screens */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <IonInput
                          value={skill.name}
                          label="Skill Name"
                          labelPlacement="floating"
                          className="w-full sm:col-span-2 lg:col-span-1"
                          onIonChange={e => {
                            const newSkills = [...formData.skills];
                            newSkills[index] = { ...skill, name: e.detail.value! };
                            setFormData(prev => ({ ...prev, skills: newSkills }));
                          }}
                          placeholder="e.g., Plumbing, Electrical, etc."
                        />
                        
                        <IonSelect
                          value={skill.level}
                          label="Level"
                          labelPlacement="floating"
                          className="w-full"
                          onIonChange={e => {
                            const newSkills = [...formData.skills];
                            newSkills[index] = { ...skill, level: e.detail.value };
                            setFormData(prev => ({ ...prev, skills: newSkills }));
                          }}
                        >
                          <IonSelectOption value="beginner">Beginner</IonSelectOption>
                          <IonSelectOption value="intermediate">Intermediate</IonSelectOption>
                          <IonSelectOption value="advanced">Advanced</IonSelectOption>
                          <IonSelectOption value="expert">Expert</IonSelectOption>
                        </IonSelect>
                        
                        <IonInput
                          type="number"
                          label="Years of Experience"
                          labelPlacement="floating"
                          value={skill.yearsOfExperience}
                          className="w-full"
                          onIonChange={e => {
                            const newSkills = [...formData.skills];
                            newSkills[index] = { ...skill, yearsOfExperience: parseInt(e.detail.value!) || 0 };
                            setFormData(prev => ({ ...prev, skills: newSkills }));
                          }}
                          min="0"
                        />
                      </div>
                    </div>
                  ))}
                  
                  {/* Add Skill Button */}
                  <IonButton
                    expand="block"
                    fill="outline"
                    size="default"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        skills: [...prev.skills, { name: '', level: 'beginner', yearsOfExperience: 0 }]
                      }));
                    }}
                    className="mt-4"
                  >
                    + Add Another Skill
                  </IonButton>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Step indicator */}
                  <div className="text-center mb-4">
                    <p className="text-sm text-gray-600">Step {currentStep + 1} of 5</p>
                  </div>
                  {/* Availability Options */}
                  <div className="space-y-4 p-3 sm:p-4 pb-6 border rounded-lg bg-white shadow-sm">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Working Days</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <IonSelect
                        value={formData.availability.weekdays}
                        label="Available on Weekdays"
                        labelPlacement="floating"
                        className="w-full"
                        onIonChange={e => setFormData(prev => ({
                          ...prev,
                          availability: { ...prev.availability, weekdays: e.detail.value }
                        }))}
                      >
                        <IonSelectOption value={true}>Yes</IonSelectOption>
                        <IonSelectOption value={false}>No</IonSelectOption>
                      </IonSelect>
                   
                      <IonSelect
                        value={formData.availability.weekends}
                        label="Available on Weekends"
                        labelPlacement="floating"
                        className="w-full"
                        onIonChange={e => setFormData(prev => ({
                          ...prev,
                          availability: { ...prev.availability, weekends: e.detail.value }
                        }))}
                      >
                        <IonSelectOption value={true}>Yes</IonSelectOption>
                        <IonSelectOption value={false}>No</IonSelectOption>
                      </IonSelect>
                    </div>
                  </div>

                  {/* Working Hours */}
                  <div className="space-y-4 p-3 sm:p-4 border rounded-lg bg-white shadow-sm">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Working Hours</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <IonInput
                        type="time"
                        label="Start Time"
                        labelPlacement="floating"
                        value={formData.availability.hours.start}
                        className="w-full"
                        onIonChange={e => setFormData(prev => ({
                          ...prev,
                          availability: {
                            ...prev.availability,
                            hours: { ...prev.availability.hours, start: e.detail.value! }
                          }
                        }))}
                      />
                      
                      <IonInput
                        type="time"
                        label="End Time"
                        labelPlacement="floating"
                        value={formData.availability.hours.end}
                        className="w-full"
                        onIonChange={e => setFormData(prev => ({
                          ...prev,
                          availability: {
                            ...prev.availability,
                            hours: { ...prev.availability.hours, end: e.detail.value! }
                          }
                        }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Step indicator */}
                  <div className="text-center mb-4">
                    <p className="text-sm text-gray-600">Step {currentStep + 1} of 5</p>
                  </div>
                  {/* Location List */}
                  {formData.serviceAreas.locations.map((location, index) => (
                    <div key={index} className="space-y-4 p-3 sm:p-4 border rounded-lg bg-white shadow-sm">
                      {/* Location Header */}
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-700">Location {index + 1}</h4>
                        <IonButton
                          size="small"
                          color="danger"
                          fill="outline"
                          onClick={() => {
                            const newLocations = formData.serviceAreas.locations.filter((_, i) => i !== index);
                            setFormData(prev => ({
                              ...prev,
                              serviceAreas: { ...prev.serviceAreas, locations: newLocations }
                            }));
                          }}
                        >
                          Remove
                        </IonButton>
                      </div>

                      {/* Address Fields - Stack on mobile, grid on larger screens */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <IonInput
                          value={location.city}
                          label='City'
                          labelPlacement='floating'
                          className="w-full"
                          onIonChange={e => {
                            const newLocations = [...formData.serviceAreas.locations];
                            newLocations[index] = { ...location, city: e.detail.value! };
                            setFormData(prev => ({
                              ...prev,
                              serviceAreas: { ...prev.serviceAreas, locations: newLocations }
                            }));
                          }}
                        />
                        
                        <IonInput
                          value={location.state}
                          label='State'
                          labelPlacement='floating'
                          className="w-full"
                          onIonChange={e => {
                            const newLocations = [...formData.serviceAreas.locations];
                            newLocations[index] = { ...location, state: e.detail.value! };
                            setFormData(prev => ({
                              ...prev,
                              serviceAreas: { ...prev.serviceAreas, locations: newLocations }
                            }));
                          }}
                        />
                        
                        <IonInput
                          value={location.country}
                          label='Country'
                          labelPlacement='floating'
                          className="w-full sm:col-span-2 lg:col-span-1"
                          onIonChange={e => {
                            const newLocations = [...formData.serviceAreas.locations];
                            newLocations[index] = { ...location, country: e.detail.value! };
                            setFormData(prev => ({
                              ...prev,
                              serviceAreas: { ...prev.serviceAreas, locations: newLocations }
                            }));
                          }}
                        />
                      </div>

                      {/* Coordinates and Location Button */}
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <IonInput
                            type="number"
                            label='Latitude'
                            labelPlacement='floating'
                            value={location.coordinates.latitude}
                            className="w-full"
                            onIonChange={e => {
                              const newLocations = [...formData.serviceAreas.locations];
                              newLocations[index] = {
                                ...location,
                                coordinates: {
                                  ...location.coordinates,
                                  latitude: parseFloat(e.detail.value!) || 0
                                }
                              };
                              setFormData(prev => ({
                                ...prev,
                                serviceAreas: { ...prev.serviceAreas, locations: newLocations }
                              }));
                            }}
                          />
                          
                          <IonInput
                            type="number"
                            label='Longitude'
                            labelPlacement='floating'
                            value={location.coordinates.longitude}
                            className="w-full"
                            onIonChange={e => {
                              const newLocations = [...formData.serviceAreas.locations];
                              newLocations[index] = {
                                ...location,
                                coordinates: {
                                  ...location.coordinates,
                                  longitude: parseFloat(e.detail.value!) || 0
                                }
                              };
                              setFormData(prev => ({
                                ...prev,
                                serviceAreas: { ...prev.serviceAreas, locations: newLocations }
                              }));
                            }}
                          />
                        </div>
                        
                        <IonButton
                          expand="block"
                          size="default"
                          color="primary"
                          disabled={gettingLocation === index}
                          onClick={() => handleGetCurrentLocation(index)}
                          className="w-full"
                        >
                          {gettingLocation === index ? 'Getting Location...' : 'Get Current Location'}
                        </IonButton>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add Location Button */}
                  <IonButton
                    expand="block"
                    fill="outline"
                    size="default"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        serviceAreas: {
                          ...prev.serviceAreas,
                          locations: [
                            ...prev.serviceAreas.locations,
                            {
                              city: '',
                              state: '',
                              country: '',
                              coordinates: { latitude: 0, longitude: 0 }
                            }
                          ]
                        }
                      }));
                    }}
                    className="mt-4"
                  >
                    + Add Another Location
                  </IonButton>

                  {/* Service Options - Stack on mobile */}
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Service Options</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <IonSelect
                        value={formData.serviceAreas.serviceAtHome}
                        label='Service at Home'
                        labelPlacement='floating'
                        className="w-full"
                        onIonChange={e => setFormData(prev => ({
                          ...prev,
                          serviceAreas: { ...prev.serviceAreas, serviceAtHome: e.detail.value }
                        }))}
                      >
                        <IonSelectOption value={true}>Yes</IonSelectOption>
                        <IonSelectOption value={false}>No</IonSelectOption>
                      </IonSelect>
                    
                      <IonSelect
                        value={formData.serviceAreas.serviceAtWorkshop}
                        label='Service at Workshop'
                        labelPlacement='floating'
                        className="w-full"
                        onIonChange={e => setFormData(prev => ({
                          ...prev,
                          serviceAreas: { ...prev.serviceAreas, serviceAtWorkshop: e.detail.value }
                        }))}
                      >
                        <IonSelectOption value={true}>Yes</IonSelectOption>
                        <IonSelectOption value={false}>No</IonSelectOption>
                      </IonSelect>
                    </div>

                    {/* Service Radius */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <IonInput
                        type="number"
                        label='Service Radius'
                        labelPlacement='floating'
                        value={formData.serviceAreas.radius}
                        className="w-full"
                        onIonChange={e => setFormData(prev => ({
                          ...prev,
                          serviceAreas: { ...prev.serviceAreas, radius: parseInt(e.detail.value!) || 0 }
                        }))}
                      />
                      
                      <IonSelect
                        value={formData.serviceAreas.unit}
                        label='Unit'
                        labelPlacement='floating'
                        className="w-full"
                        onIonChange={e => setFormData(prev => ({
                          ...prev,
                          serviceAreas: { ...prev.serviceAreas, unit: e.detail.value }
                        }))}
                      >
                        <IonSelectOption value="km">Kilometers</IonSelectOption>
                        <IonSelectOption value="mi">Miles</IonSelectOption>
                      </IonSelect>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Step indicator */}
                  <div className="text-center mb-4">
                    <p className="text-sm text-gray-600">Step {currentStep + 1} of 5</p>
                  </div>
                  {/* Pricing Model */}
                  <div className="space-y-4 p-3 sm:p-4 border rounded-lg bg-white shadow-sm">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Pricing Model</h4>
                    
                    <IonSelect
                      value={formData.pricing.model}
                      label='Pricing Model'
                      labelPlacement='floating'
                      className="w-full"
                      onIonChange={e => setFormData(prev => ({
                        ...prev,
                        pricing: { ...prev.pricing, model: e.detail.value }
                      }))}
                    >
                      <IonSelectOption value="hourly">Hourly Rate</IonSelectOption>
                      <IonSelectOption value="fixed">Fixed Rate</IonSelectOption>
                      <IonSelectOption value="project">Project Based</IonSelectOption>
                    </IonSelect>
                  </div>

                  {/* Rates and Charges */}
                  <div className="space-y-4 p-3 sm:p-4 border rounded-lg bg-white shadow-sm">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Rates & Charges</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <IonInput
                        type="number"
                        label='Base Rate'
                        labelPlacement='floating'
                        value={formData.pricing.baseRate}
                        className="w-full"
                        onIonChange={e => {
                          const value = e.detail.value;
                          const baseRate = value ? parseFloat(value) : 0;
                          console.log('Base rate changed:', { rawValue: value, parsedValue: baseRate });
                          setFormData(prev => ({
                            ...prev,
                            pricing: { ...prev.pricing, baseRate: baseRate }
                          }));
                        }}
                      />
                      
                      <IonSelect
                        value={formData.pricing.currency}
                        label='Currency'
                        labelPlacement='floating'
                        className="w-full"
                        onIonChange={e => setFormData(prev => ({
                          ...prev,
                          pricing: { ...prev.pricing, currency: e.detail.value }
                        }))}
                      >
                        <IonSelectOption value="IND">IND</IonSelectOption>
                        <IonSelectOption value="USD">USD</IonSelectOption>
                        <IonSelectOption value="GBP">GBP</IonSelectOption>
                      </IonSelect>
                      
                      <IonInput
                        type="number"
                        label='Minimum Charge'
                        labelPlacement='floating'
                        value={formData.pricing.minimumCharge}
                        className="w-full"
                        onIonChange={e => setFormData(prev => ({
                          ...prev,
                          pricing: { ...prev.pricing, minimumCharge: parseFloat(e.detail.value!) || 0 }
                        }))}
                      />
                      
                      <IonInput
                        type="number"
                        label='Travel Fee'
                        labelPlacement='floating'
                        value={formData.pricing.travelFee}
                        className="w-full"
                        onIonChange={e => setFormData(prev => ({
                          ...prev,
                          pricing: { ...prev.pricing, travelFee: parseFloat(e.detail.value!) || 0 }
                        }))}
                      />
                    </div>
                  </div>

                  {/* Service Packages */}
                  <div className="space-y-4 p-3 sm:p-4 border rounded-lg bg-white shadow-sm">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Service Packages</h4>
                    
                    <IonInput
                      label='Service Packages (comma separated)'
                      labelPlacement='floating'
                      value={(formData.pricing.servicePackages || []).join(', ')}
                      className="w-full"
                      onIonChange={e => setFormData(prev => ({
                        ...prev,
                        pricing: { 
                          ...prev.pricing, 
                          servicePackages: e.detail.value 
                            ? e.detail.value.split(',').map((pkg: string) => pkg.trim()).filter(Boolean)
                            : []
                        }
                      }))}
                      placeholder="e.g., Basic, Premium, Deluxe"
                    />
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <IonAlert
                  isOpen={!!error}
                  onDidDismiss={() => setError(null)}
                  header="Error"
                  message={error}
                  buttons={['OK']}
                />
              )}

              {/* Navigation Buttons */}
              <div className="ion-padding pb-8">
                <div className="navigation-buttons space-y-4">
                  {/* Navigation actions */}
                  <div className="flex gap-4">
                    <IonButton
                      fill="outline"
                      expand="block"
                      className="flex-1"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('⬅️ Previous clicked, current step:', currentStep);
                        previousStep();
                      }}
                      disabled={currentStep === 0 || saving}
                    >
                      Previous
                    </IonButton>
                    
                    <IonButton
                      fill="solid"
                      expand="block"
                      className="flex-1"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('➡️ Next/Submit clicked, current step:', currentStep);
                        
                        if (!validateStep()) {
                          console.log('❌ Step validation failed');
                          return;
                        }

                        // Save current step data
                        const saved = await handleSubmit(currentStep !== 4);
                        if (!saved) {
                          console.log('❌ Failed to save step data');
                          return;
                        }
                        
                        if (currentStep === 4) {
                          console.log('🎯 Final step - form completed');
                        } else {
                          console.log('➡️ Moving to next step');
                          nextStep();
                        }
                      }}
                      disabled={saving}
                    >
                      {saving ? (
                        <div className="flex items-center gap-2">
                          <IonSpinner name="crescent" /> Saving...
                        </div>
                      ) : currentStep === 4 ? (
                        'Complete Profile'
                      ) : (
                        'Next'
                      )}
                    </IonButton>
                  </div>
                  
                  {/* Step indicator */}
                  <div className="text-center text-sm text-gray-600">
                    Step {currentStep + 1} of 5
                  </div>
                </div>
          </div>
          
          {/* Error Alert */}
          {error && (
            <div className="ion-padding">
              <IonAlert
                isOpen={!!error}
                onDidDismiss={() => setError(null)}
                header="Error"
                message={error}
                buttons={['OK']}
              />
            </div>
          )}
        </div>
      </div>
    </IonContent>
  );
};