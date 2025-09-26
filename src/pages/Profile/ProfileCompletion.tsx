import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStep } from '../../context/StepContext';
import { useLocation } from '../../hooks/useLocation';
import { useImageGallery } from '../../hooks/useImageGallery';
import { camera } from 'ionicons/icons';
import './ProfileCompletion.css';
import { VerificationBadge, NetworkErrorMessage } from '../../components/ui';
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
import { getSectorSkills } from '../../utils/sectorServices';
import {useSectorTranslation } from '../../hooks/useSectorTranslation';
import { Modal } from '../../components/ui/Modal';
import { FormDataType, DocumentType, Document, Skill } from './types';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: { url: string; name: string; type: string } | null;
}

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({ isOpen, onClose, document }) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title={document?.name}
    >
      <div className="document-preview-wrapper">
        {document?.type === 'application/pdf' ? (
          <iframe
            src={document?.url}
            className="pdf-viewer"
            title={document?.name}
          />
        ) : (
          <div className="image-container">
            <img
              src={document?.url}
              alt={document?.name}
              className="preview-image"
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export const ProfileCompletion = () => {
  const { translateSector, toEnglish, getSectorNames } = useSectorTranslation();
  const navigate = useNavigate();
  const auth = useAuth();
  const { user } = auth;
  const { currentStep, nextStep: baseNextStep, previousStep: basePreviousStep, canGoNext, canGoPrevious } = useStep();
  const [, setLoading] = useState(true);
  const { requestPermission, getCurrentLocationWithAddress, permissionStatus, locationData } = useLocation();

  // Wrapper for nextStep that ensures data is saved
  const handleNextStep = async () => {
    if (validateStep()) {
      await commitChanges();
      baseNextStep();
    }
  };

  // Wrapper for previousStep that ensures data is saved
  const handlePreviousStep = async () => {
    await commitChanges();
    basePreviousStep();
  };
  const [availableSectors] = useState<string[]>(() => getSectorNames());
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);

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
  const [unsavedData, setUnsavedData] = useState<Partial<FormDataType>>({});
  const [uploadingDocument, setUploadingDocument] = useState<DocumentType | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string; type: string } | null>(null);
  const [formData, setFormData] = useState<FormDataType>({
    // Basic Info
    name: user?.name || '',
    userName: '',
    sector: user?.sector || '',
    phoneNumber: user?.phoneNumber || '',
    avatar: user?.avatar || '',
    
    // Documents
    documents: {
      professional: []
    },
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
      radius: 5,
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
  
  // Use the image gallery hook after formData is initialized
  const { 
    currentImage, 
    imageStatus, 
    isTransitioning,
    selectImage 
  } = useImageGallery({ 
    images: userImages,
    initialImage: (unsavedData).avatar,
    autoSwitchInterval: 3000
  });


  useEffect(() => {
    if (currentImage) {
      setFormData(prev => ({
        ...prev,
        avatar: currentImage.key
      }));
    }
  }, [currentImage]);
  
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

  // Handle document upload
  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>, docType: DocumentType) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setError('Please upload a valid image or PDF file');
      return;
    }
    
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size must be less than 5MB');
      return;
    }

    if (!user?.email) {
      setError('User email not found. Please log in again.');
      return;
    }

    try {
      setUploadingDocument(docType);
      setError(null);
      
      // Use username or email as the identifier
      const username = formData.userName || user.email.split('@')[0];
      
      // Upload document using ImageService
      const s3Key = await ImageService.uploadImage({
        username,
        file,
        folder: `documents`
      });
      
      // Wait a moment for S3 consistency
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get CDN URL for the document
      const documentUrl = ImageService.getImageUrl(s3Key);
      
      // Update form data with document information
      const documentInfo = {
        key: s3Key,
        url: documentUrl,
        name: file.name,
        type: file.type,
        size: file.size,
        verified: false,
        verifiedAt: null,
        verifiedBy: null,
        uploadedAt: new Date().toISOString()
      };
      
      setFormData(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          [docType]: docType === 'professional' 
            ? [...(prev.documents.professional || []), documentInfo]
            : documentInfo
        }
      }));
      
      // Verify the URL is accessible
      try {
        const response = await fetch(documentUrl, { method: 'HEAD' });
        if (!response.ok) {
          console.warn(`Document URL not yet accessible: ${documentUrl}`);
        }
      } catch (err) {
        console.warn('Could not verify document URL:', err);
      }
      
      console.log(`✅ ${docType} document uploaded successfully:`, s3Key);
      
    } catch (err) {
      console.error(`❌ ${docType} document upload failed:`, err);
      setError(`Failed to upload ${docType} document: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUploadingDocument(null);
    }
  };

  // Load user images from server
  const loadUserImages = async (username?: string) => {
    if (!username && !user?.email) return;
    
    try {
      const userIdentifier = username || (unsavedData).userName || user!.email.split('@')[0];
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
      console.log('🗑️ Attempting to delete image:', imageKey);
      
      // Remove from local state first for immediate UI feedback
      setUserImages(prev => prev.filter(img => img.key !== imageKey));
      
      // Clear the avatar if this was the current one
      if (formData.avatar && (
        formData.avatar.includes(imageKey) || 
        formData.avatar === ImageService.getImageUrl(imageKey) ||
        formData.avatar === imageKey
      )) {
        console.log('🖼️ Clearing avatar as it was deleted');
        setFormData(prev => ({ ...prev, avatar: '' }));
      }

      // Actually delete the image
      await ImageService.deleteImage(imageKey);
      console.log('🗑️ Image deleted successfully:', imageKey);
      
      // Save the profile update to persist avatar change
      await handleSubmit(true);
      
    } catch (err) {
      console.error('❌ Failed to delete image:', err);
      setError(`Failed to delete image: ${err instanceof Error ? err.message : 'Unknown error'}`);
      // Reload images in case deletion failed
      loadUserImages(user?.email?.split('@')[0]);
    }
  };

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
          console.log('Loading user data:', { userData, prevName: formData.name });
          setFormData(prev => ({
            ...prev,
            name: userData.name || user?.name || prev.name,
            userName: userData.userName || prev.userName,
            avatar: userData.avatar || prev.avatar,
            sector: userData.sector || prev.sector,
            phoneNumber: userData.phone || prev.phoneNumber,
            skills: userData.skills || prev.skills,
            availability: userData.availability || prev.availability,
            serviceAreas: {
              ...prev.serviceAreas,
              locations: userData.serviceAreas?.locations || prev.serviceAreas.locations,
              serviceAtHome: userData.serviceAreas?.serviceAtHome ?? prev.serviceAreas.serviceAtHome,
              serviceAtWorkshop: userData.serviceAreas?.serviceAtWorkshop ?? prev.serviceAreas.serviceAtWorkshop,
              radius: userData.serviceAreas?.radius || prev.serviceAreas.radius,
              unit: userData.serviceAreas?.unit || prev.serviceAreas.unit
            },
            pricing: userData.pricing || prev.pricing, // Keep default pricing as it's not in the User type
            documents: {
              ...prev.documents,
              aadhaar: userData.documents?.aadhaar ? {
                ...userData.documents.aadhaar,
                url: ImageService.getImageUrl(userData.documents.aadhaar.key)
              } : undefined,
              pan: userData.documents?.pan ? {
                ...userData.documents.pan,
                url: ImageService.getImageUrl(userData.documents.pan.key)
              } : undefined,
              professional: Array.isArray(userData.documents?.professional) 
                ? userData.documents.professional.map(doc => ({
                    ...doc,
                    url: ImageService.getImageUrl(doc.key),
                    verified: doc.verified || false,
                    verifiedAt: doc.verifiedAt || null,
                    verifiedBy: doc.verifiedBy || null
                  } as Document))
                : []
            }
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
    
    // Initialize skills step with a default skill only when entering the step for the first time
    if (currentStep === 1 && (!formData.skills || formData.skills.length === 0)) {
      console.log('🔧 Adding default skill template');
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
  }, [currentStep]); // Only run when step changes


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

  useEffect(() => {
    console.log('Debug: formData.name initialized as:', formData.name);
  }, [formData.name]);

  // Load initial skills based on selected sector
  useEffect(() => {
    if (formData.sector) {
      const skills = getSectorSkills(formData.sector);
      setAvailableSkills(skills);
    } else {
      setAvailableSkills([]);
    }
  }, [formData.sector]);

  const handleFieldChange = (field: keyof FormDataType, value: any) => {
    if (field === 'sector') {
      const skills = getSectorSkills(value);
      setAvailableSkills(skills);
      setUnsavedData(prev => ({
        ...prev,
        [field]: value
      }));
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    } else if (field === 'skills') {
      // Handle skills array with proper typing and preserve existing skill details
      const newSkills = Array.isArray(value) ? value : [];
      const updatedSkills = newSkills.map(skill => {
        if (typeof skill === 'string') {
          // If it's just a skill name string, create a new skill object
          return {
            name: skill,
            level: 'beginner' as const,
            yearsOfExperience: 0
          };
        } else {
          // If it's already a skill object, preserve its data
          return {
            name: skill.name,
            level: skill.level || 'beginner',
            yearsOfExperience: skill.yearsOfExperience || 0
          };
        }
      });
      setUnsavedData(prev => ({ ...prev, [field]: updatedSkills }));
      setFormData(prev => ({ ...prev, [field]: updatedSkills }));
    } else {
      setUnsavedData(prev => ({ ...prev, [field]: value }));
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

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
          
          if (!formData.skills || formData.skills.length === 0) {
            console.log('❌ Validation failed: No skills found');
            setError('Please add at least one skill');
            return false;
          }

          const validSkills = formData.skills.filter(skill => skill && skill.name && skill.name.trim());
          if (validSkills.length === 0) {
            console.log('❌ Validation failed: No valid skills found');
            setError('Please add at least one skill with a name');
            return false;
          }

          const invalidSkills = validSkills.some(skill => {
            if (!skill.level) {
              setError('Please select a skill level for all skills');
              return true;
            }
            if (typeof skill.yearsOfExperience !== 'number') {
              setError('Please enter years of experience for all skills');
              return true;
            }
            return false;
          });

          if (invalidSkills) {
            console.log('❌ Validation failed: Invalid skill data found');
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

        case 5:
          console.log('Validating documents step');
          if (!formData.documents.aadhaar) {
            console.log('❌ Validation failed: Aadhaar document missing');
            setError('Please upload your Aadhaar card');
            return false;
          }
          if (!formData.documents.pan) {
            console.log('❌ Validation failed: PAN document missing');
            setError('Please upload your PAN card');
            return false;
          }
          // Professional documents are optional, no validation needed
          console.log('✅ Document validation passed');
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

  

  // Helper function to commit changes and ensure persistence
  const commitChanges = async () => {
    console.log('Committing changes for step:', currentStep);
    
    // Attempt to save to backend if needed
    await handleSubmit(true);
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
      
      // For partial saves, only send the current step's data plus any required fields
      if (isPartialSave) {
        switch (currentStep) {
          case 0:
            // Ensure avatar is a valid URL before sending
            let avatarUrl = formData.avatar;
            if (avatarUrl && !avatarUrl.startsWith('http') && !avatarUrl.startsWith('data:')) {
              const avatarImage = userImages.find(img => img.key === avatarUrl);
              if (avatarImage?.url) {
                avatarUrl = avatarImage.url;
              } else {
                avatarUrl = ImageService.getImageUrl(avatarUrl);
              }
            }
            dataToUpdate = {
              displayName: formData.name,
              userName: formData.userName,
              sector: formData.sector as ServiceSector,
              phone: formData.phoneNumber,
              avatar: avatarUrl,
              // Include skills to preserve them
              skills: formData.skills
            };
            console.log('📤 Submitting basic info data:', dataToUpdate);
            break;
            
          case 1:
            // Validate skills
            const validSkills = formData.skills || [];
            if (validSkills.length === 0) {
              setError('Please select at least one skill');
              setSaving(false);
              return false;
            }
            dataToUpdate = {
              skills: validSkills.map(skill => ({
                name: skill.name,
                level: skill.level || 'beginner',
                yearsOfExperience: parseInt(String(skill.yearsOfExperience)) || 0
              }))
            };
            console.log('📤 Submitting skills data:', dataToUpdate.skills);
            break;
            
          case 2:
            dataToUpdate = {
              availability: formData.availability,
              // Include skills to preserve them
              skills: formData.skills
            };
            console.log('📤 Submitting availability data:', dataToUpdate);
            break;
            
          case 3:
            dataToUpdate = {
              serviceAreas: formData.serviceAreas,
              // Include skills to preserve them
              skills: formData.skills
            };
            console.log('📤 Submitting service areas data:', dataToUpdate);
            break;
            
          case 4:
            dataToUpdate = {
              pricing: formData.pricing,
              // Include skills to preserve them
              skills: formData.skills
            };
            console.log('📤 Submitting pricing data:', dataToUpdate);
            break;

          case 5:
            // Final step with document verification, send all data
            // Ensure avatar is a valid URL
            let finalAvatarUrl = formData.avatar;
            if (finalAvatarUrl && !finalAvatarUrl.startsWith('http') && !finalAvatarUrl.startsWith('data:')) {
              const avatarImage = userImages.find(img => img.key === finalAvatarUrl);
              if (avatarImage?.url) {
                finalAvatarUrl = avatarImage.url;
              } else {
                finalAvatarUrl = ImageService.getImageUrl(finalAvatarUrl);
              }
            }

            dataToUpdate = {
              displayName: formData.name,
              userName: formData.userName,
              sector: formData.sector as ServiceSector,
              phone: formData.phoneNumber,
              avatar: finalAvatarUrl,
              skills: formData.skills,
              availability: formData.availability,
              serviceAreas: formData.serviceAreas,
              pricing: formData.pricing,
              documents: formData.documents
            };
            console.log('📤 Submitting complete profile data:', dataToUpdate);
            break;
        }
      } else {
        // For non-partial saves (final submission), send all data
        let finalAvatarUrl = formData.avatar;
        if (finalAvatarUrl && !finalAvatarUrl.startsWith('http') && !finalAvatarUrl.startsWith('data:')) {
          const avatarImage = userImages.find(img => img.key === finalAvatarUrl);
          if (avatarImage?.url) {
            finalAvatarUrl = avatarImage.url;
          } else {
            finalAvatarUrl = ImageService.getImageUrl(finalAvatarUrl);
          }
        }

        dataToUpdate = {
          displayName: formData.name,
          userName: formData.userName,
          sector: formData.sector as ServiceSector,
          phone: formData.phoneNumber,
          avatar: finalAvatarUrl,
          skills: formData.skills,
          availability: formData.availability,
          serviceAreas: formData.serviceAreas,
          pricing: formData.pricing,
          documents: formData.documents
        };
      }

      console.log(`📤 Submitting ${isPartialSave ? 'partial' : 'complete'} profile data:`, dataToUpdate);
      const updatedProfile = await UserService.updateUser(user.email, dataToUpdate);

      if (updatedProfile) {
        console.log('✅ Profile updated successfully');
        if (!isPartialSave && currentStep === 5) {
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
          <p className="text-sm text-gray-600">Step {currentStep + 1} of 6</p>
        </div>

      <div className="space-y-4">
              {/* Step Progress */}
              <div className="flex justify-between items-center mb-8 px-1 sm:px-2 md:px-4 overflow-x-auto">
                {['Basic Info', 'Skills', 'Availability', 'Service Areas', 'Pricing', 'Document Verification'].map((step, index) => {
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

                      // First commit any unsaved changes
                      commitChanges();

                      // Then save to the server
                      const saved = await handleSubmit(true);
                      if (!saved) {
                        setError('Failed to save current step data. Please try again.');
                        return;
                      }
                    }
                    
                    // Reset unsaved changes before moving to new step
                    setUnsavedData({});
                    
                    // Navigate to the selected step
                    if (index < currentStep) {
                      // Going backwards
                      for (let i = currentStep; i > index; i--) {
                        handlePreviousStep();
                      }
                    } else if (index > currentStep) {
                      // Going forwards
                      for (let i = currentStep; i < index; i++) {
                        handleNextStep();
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
                <div className="space-y-4 sm:space-y-6 pb-16 sm:pb-8">
              
                  {/* Profile Picture */}
                  <div className="space-y-4 p-3 sm:p-4 pb-6 border rounded-lg bg-white shadow-sm">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Profile Picture</h4>
                    
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div 
                        className={`profile-image-container ${isTransitioning ? 'transitioning' : ''}`}
                        data-images={imageStatus}
                        onClick={() => document.getElementById('imageUpload')?.click()}
                      >
                        {userImages.length > 0 ? (
                          <>
                            <img
                              src={currentImage?.url || ''}
                              alt="Profile"
                              className={`profile-image animate__fadeIn ${isTransitioning ? 'fade-out' : 'fade-in'}`}
                              data-auto-switch="true"
                            />
                            <div 
                              className="profile-image-overlay"
                              onClick={(e) => e.stopPropagation()} // Prevent click on overlay from triggering file input
                            >
                              <div className="flex items-center space-x-2">
                                {userImages.map((image, index) => (
                                  <div
                                    key={index}
                                    className={`w-2 h-2 rounded-full cursor-pointer transition-all duration-200 ${
                                      (formData.avatar === image.key || formData.avatar === image.url)
                                        ? 'bg-white'
                                        : 'bg-white/50 hover:bg-white/75'
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      selectImage(image.key);
                                    }}
                                  />
                                ))}
                              </div>
                              <div className="absolute bottom-2 right-2 flex space-x-2">
                                <IonButton 
                                  fill="clear" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    document.getElementById('imageUpload')?.click();
                                  }}
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
                                      e.preventDefault();
                                      const currentImage = userImages.find(
                                        img => img.key === formData.avatar || img.url === formData.avatar
                                      );
                                      if (currentImage) {
                                        handleDeleteImage(currentImage.key);
                                      } else if (formData.avatar) {
                                        // If we can't find the image in userImages but have an avatar, try to delete it
                                        const key = formData.avatar.split('/').pop() || formData.avatar;
                                        handleDeleteImage(key);
                                      }
                                    }}
                                    className="bg-red-500/75 hover:bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl transition-colors"
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
                        onIonInput={e => {
                          const value = e.detail.value!;
                          if (formData.name !== value) {
                            setFormData(prev => ({ ...prev, name: value }));
                          }
                        }}
                        placeholder="Enter your name"
                        required
                      />
                      
                      <IonInput
                        value={formData.userName}
                        label="User Name"
                        labelPlacement="floating"
                        className="w-full"
                        onIonInput={e => {
                          const value = e.detail.value!;
                          if (formData.userName !== value) {
                            setFormData(prev => ({ ...prev, userName: value }));
                          }
                        }}
                        placeholder="Enter your user name"
                        required
                      />
                      
                      <IonSelect
                        value={translateSector(formData.sector)}
                        label="Service Sector"
                        labelPlacement="floating"
                        className="w-full"
                        onIonChange={e => {
                          const selectedValue = e.detail.value;
                          const englishValue = toEnglish(selectedValue);
                          console.log('Selected:', selectedValue, 'Converted:', englishValue);
                          if (formData.sector !== englishValue) {
                            setFormData(prev => ({ ...prev, sector: englishValue }));
                          }
                        }}
                        placeholder="Select your sector"
                      >
                        {availableSectors.map(sector => (
                          <IonSelectOption key={sector} value={sector}>
                            {translateSector(sector)}
                          </IonSelectOption>
                        ))}
                      </IonSelect>
                    
                      <IonInput
                        type="tel"
                        label="Phone Number"
                        labelPlacement="floating"
                        value={formData.phoneNumber}
                        className="w-full"
                        onIonInput={e => {
                          const value = e.detail.value!;
                          if (formData.phoneNumber !== value) {
                            setFormData(prev => ({ ...prev, phoneNumber: value }));
                          }
                        }}
                        placeholder="Enter your phone number"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4 sm:space-y-6 pb-16 sm:pb-8">
                  {/* Skills Selection */}
                  <div className="skills-selection p-4 border rounded-lg bg-white shadow-sm">
                    <IonSelect
                      value={formData.skills?.map(s => s.name) || []}
                      label="Skills"
                      labelPlacement="floating"
                      className="w-full"
                      onIonChange={e => handleFieldChange('skills', e.detail.value || [])}
                      placeholder="Select skills"
                      multiple={true}
                      onClick={() => {
                        // This will trigger the select to open on click
                        const select = document.querySelector('.skills-select-interface');
                        if (select) {
                          select.classList.add('show-options');
                        }
                      }}
                    >
                      {availableSkills.map(skill => (
                        <IonSelectOption key={skill} value={skill} className="select-option">
                          {skill}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </div>

                  {/* Selected Skills List */}
                  {formData.skills?.map((skill: Skill, index) => (
                    <div key={index} className="p-1.5 sm:p-2 border rounded-lg bg-white shadow-sm">
                      {/* Skill Fields - Compact layout */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-2">
                        <IonInput
                          value={skill.name}
                          label="Skill Name"
                          labelPlacement="floating"
                          className="w-full sm:w-2/5 text-sm"
                          onIonChange={e => {
                            const value = e.detail.value || '';
                            if (skill.name !== value) {
                              const newSkills = [...formData.skills];
                              newSkills[index] = { ...skill, name: value };
                              setFormData(prev => ({ ...prev, skills: newSkills }));
                            }
                          }}
                          placeholder="Selected Skill Name..."
                        />
                        <IonInput
                          type="number"
                          label="Years of Experience"
                          labelPlacement="floating"
                          value={skill.yearsOfExperience}
                          className="w-full sm:w-1/5 text-sm"
                          onIonInput={e => {
                            const value = parseInt(e.detail.value!) || 0;
                            if (skill.yearsOfExperience !== value) {
                              const newSkills = [...formData.skills];
                              newSkills[index] = { ...skill, yearsOfExperience: value };
                              setFormData(prev => ({ ...prev, skills: newSkills }));
                            }
                          }}
                          min="0"
                        />
                        <IonSelect
                          value={skill.level}
                          label="Level"
                          labelPlacement="floating"
                          className="w-full sm:w-2/5 text-sm"
                          onIonChange={e => {
                            const value = e.detail.value;
                            if (skill.level !== value) {
                              const newSkills = [...formData.skills];
                              newSkills[index] = { ...skill, level: value };
                              setFormData(prev => ({ ...prev, skills: newSkills }));
                            }
                          }}
                        >
                          <IonSelectOption value="beginner">Beginner</IonSelectOption>
                          <IonSelectOption value="intermediate">Intermediate</IonSelectOption>
                          <IonSelectOption value="advanced">Advanced</IonSelectOption>
                          <IonSelectOption value="expert">Expert</IonSelectOption>
                        </IonSelect>
                        
                        <IonButton
                          size="small"
                          color="danger"
                          fill="outline"
                          className="w-full sm:w-auto sm:min-w-[70px] text-xs"
                          onClick={() => {
                            const newSkills = formData.skills.filter((_, i) => i !== index);
                            setFormData(prev => ({ ...prev, skills: newSkills }));
                          }}
                        >
                          Remove
                        </IonButton>
                      </div>
                    </div>
                  ))}
                
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4 sm:space-y-6 pb-16 sm:pb-8">
                 
                  {/* Availability Options */}
                  <div className="space-y-4 p-3 sm:p-4 pb-6 border rounded-lg bg-white shadow-sm">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Working Days</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <IonSelect
                        value={formData.availability.weekdays}
                        label="Available on Weekdays"
                        labelPlacement="floating"
                        className="w-full"
                        onIonChange={e => {
                          const value = e.detail.value;
                          if (formData.availability.weekdays !== value) {
                            setFormData(prev => ({
                              ...prev,
                              availability: { ...prev.availability, weekdays: value }
                            }));
                          }
                        }}
                      >
                        <IonSelectOption value={true}>Yes</IonSelectOption>
                        <IonSelectOption value={false}>No</IonSelectOption>
                      </IonSelect>
                   
                      <IonSelect
                        value={formData.availability.weekends}
                        label="Available on Weekends"
                        labelPlacement="floating"
                        className="w-full"
                        onIonChange={e => {
                          const value = e.detail.value;
                          if (formData.availability.weekends !== value) {
                            setFormData(prev => ({
                              ...prev,
                              availability: { ...prev.availability, weekends: value }
                            }));
                          }
                        }}
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
                        onIonInput={e => {
                          const value = e.detail.value!;
                          if (formData.availability.hours.start !== value) {
                            setFormData(prev => ({
                              ...prev,
                              availability: {
                                ...prev.availability,
                                hours: { ...prev.availability.hours, start: value }
                              }
                            }));
                          }
                        }}
                      />
                      
                      <IonInput
                        type="time"
                        label="End Time"
                        labelPlacement="floating"
                        value={formData.availability.hours.end}
                        className="w-full"
                        onIonInput={e => {
                          const value = e.detail.value!;
                          if (formData.availability.hours.end !== value) {
                            setFormData(prev => ({
                              ...prev,
                              availability: {
                                ...prev.availability,
                                hours: { ...prev.availability.hours, end: value }
                              }
                            }));
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4 sm:space-y-6 pb-16 sm:pb-8">
                  
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
                          onIonInput={e => {
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
                          onIonInput={e => {
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
                          onIonInput={e => {
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
                            onIonInput={e => {
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
                            onIonInput={e => {
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
                        onIonChange={e => {
                          setFormData(prev => ({
                            ...prev,
                            serviceAreas: { ...prev.serviceAreas, serviceAtHome: e.detail.value }
                          }));
                        }}
                      >
                        <IonSelectOption value={true}>Yes</IonSelectOption>
                        <IonSelectOption value={false}>No</IonSelectOption>
                      </IonSelect>
                    
                      <IonSelect
                        value={formData.serviceAreas.serviceAtWorkshop}
                        label='Service at Workshop'
                        labelPlacement='floating'
                        className="w-full"
                        onIonChange={e => {
                          setFormData(prev => ({
                            ...prev,
                            serviceAreas: { ...prev.serviceAreas, serviceAtWorkshop: e.detail.value }
                          }));
                        }}
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
                        onIonInput={e => {
                          const value = parseInt(e.detail.value!) || 0;
                          if (formData.serviceAreas.radius !== value) {
                            setFormData(prev => ({
                              ...prev,
                              serviceAreas: { ...prev.serviceAreas, radius: value }
                            }));
                          }
                        }}
                      />
                      
                      <IonSelect
                        value={formData.serviceAreas.unit}
                        label='Unit'
                        labelPlacement='floating'
                        className="w-full"
                        onIonChange={e => {
                          const value = e.detail.value;
                          setFormData(prev => ({
                            ...prev,
                            serviceAreas: { ...prev.serviceAreas, unit: value }
                          }));
                        }}
                      >
                        <IonSelectOption value="km">Kilometers</IonSelectOption>
                        <IonSelectOption value="mi">Miles</IonSelectOption>
                      </IonSelect>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-4 sm:space-y-6 pb-16 sm:pb-8">
                
                  {/* Pricing Model */}
                  <div className="space-y-4 p-3 sm:p-4 border rounded-lg bg-white shadow-sm">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Pricing Model</h4>
                    
                    <IonSelect
                      value={formData.pricing.model}
                      onIonChange={e => setFormData(prev => ({
                        ...prev,
                        pricing: { ...prev.pricing, model: e.detail.value }
                      }))}
                      className="w-full"
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
                        onIonInput={e => {
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
                        onIonInput={e => setFormData(prev => ({
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
                        onIonInput={e => setFormData(prev => ({
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
                      onIonInput={e => setFormData(prev => ({
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

              {currentStep === 5 && (
                <div className="space-y-4 sm:space-y-6 pb-16 sm:pb-8">
                  
                  {/* Document Upload Section */}
                  <div className="space-y-4 p-3 sm:p-4 border rounded-lg bg-white shadow-sm">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Document Verification</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Aadhaar Card Upload */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-700">
                            Aadhaar Card
                          </label>
                          {formData.documents.aadhaar && (
                            <VerificationBadge
                              isVerified={formData.documents.aadhaar.verified}
                              verifiedAt={formData.documents.aadhaar.verifiedAt}
                              verifiedBy={formData.documents.aadhaar.verifiedBy}
                              showTooltip={true}
                            />
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => handleDocumentUpload(e, 'aadhaar')}
                            className="block w-full text-sm text-gray-500
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-full file:border-0
                              file:text-sm file:font-semibold
                              file:bg-violet-50 file:text-violet-700
                              hover:file:bg-violet-100"
                            disabled={uploadingDocument === 'aadhaar'}
                          />
                          {uploadingDocument === 'aadhaar' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                              <IonSpinner name="crescent" />
                            </div>
                          )}
                        </div>
                        {formData.documents.aadhaar && (
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-2">
                              <span>{formData.documents.aadhaar.name}</span>
                              {formData.documents.aadhaar.verified === false && (
                                <div className="flex items-center gap-1 text-gray-400">
                                  <span>Pending Verification</span>
                                </div>
                              )}
                            </div>
                            <IonButton
                              fill="clear"
                              color="danger"
                              size="small"
                              onClick={() => {
                                if (formData.documents.aadhaar?.key) {
                                  ImageService.deleteImage(formData.documents.aadhaar.key);
                                  setFormData(prev => ({
                                    ...prev,
                                    documents: {
                                      ...prev.documents,
                                      aadhaar: undefined
                                    }
                                  }));
                                }
                              }}
                            >
                              Remove
                            </IonButton>
                            {formData.documents.aadhaar?.url && (
                              <IonButton
                                fill="clear"
                                color="primary"
                                size="small"
                                onClick={() => {
                                  const docInfo = formData.documents.aadhaar!;
                                  console.log('Opening document:', docInfo);
                                  setSelectedImage({
                                    url: docInfo.url || ImageService.getImageUrl(docInfo.key),
                                    name: docInfo.name,
                                    type: docInfo.type
                                  });
                                }}
                              >
                                View
                              </IonButton>
                            )}
                          </div>
                        )}
                      </div>

                      {/* PAN Card Upload */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-700">
                            PAN Card
                          </label>
                          {formData.documents.pan && (
                            <VerificationBadge
                              isVerified={formData.documents.pan.verified}
                              verifiedAt={formData.documents.pan.verifiedAt}
                              verifiedBy={formData.documents.pan.verifiedBy}
                              showTooltip={true}
                            />
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => handleDocumentUpload(e, 'pan')}
                            className="block w-full text-sm text-gray-500
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-full file:border-0
                              file:text-sm file:font-semibold
                              file:bg-violet-50 file:text-violet-700
                              hover:file:bg-violet-100"
                            disabled={uploadingDocument === 'pan'}
                          />
                          {uploadingDocument === 'pan' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                              <IonSpinner name="crescent" />
                            </div>
                          )}
                        </div>
                        {formData.documents.pan && (
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-2">
                              <span>{formData.documents.pan.name}</span>
                              {formData.documents.pan.verified === false && (
                                <div className="flex items-center gap-1 text-gray-400">
                                  <span>Pending Verification</span>
                                </div>
                              )}
                            </div>
                            <IonButton
                              fill="clear"
                              color="danger"
                              size="small"
                              onClick={() => {
                                if (formData.documents.pan?.key) {
                                  ImageService.deleteImage(formData.documents.pan.key);
                                  setFormData(prev => ({
                                    ...prev,
                                    documents: {
                                      ...prev.documents,
                                      pan: undefined
                                    }
                                  }));
                                }
                              }}
                            >
                              Remove
                            </IonButton>
                            {formData.documents.pan?.url && (
                              <IonButton
                                fill="clear"
                                color="primary"
                                size="small"
                                onClick={() => {
                                  const docInfo = formData.documents.pan!;
                                  console.log('Opening document:', docInfo);
                                  setSelectedImage({
                                    url: docInfo.url || ImageService.getImageUrl(docInfo.key),
                                    name: docInfo.name,
                                    type: docInfo.type
                                  });
                                }}
                              >
                                View
                              </IonButton>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Professional Certificates */}
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">
                          Professional Certificates (Optional) {formData.documents.professional && formData.documents.professional.length > 0 && `(${formData.documents.professional.length})`}
                        </label>
                        {formData.documents.professional && formData.documents.professional.length > 0 && (
                          <div className="flex gap-2">
                            {formData.documents.professional.map((doc) => (
                              <VerificationBadge
                                key={doc.key}
                                isVerified={doc.verified}
                                verifiedAt={doc.verifiedAt}
                                verifiedBy={doc.verifiedBy}
                                showTooltip={true}
                                className="scale-75"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleDocumentUpload(e, 'professional')}
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-violet-50 file:text-violet-700
                            hover:file:bg-violet-100"
                          disabled={uploadingDocument === 'professional'}
                        />
                        {uploadingDocument === 'professional' && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                            <IonSpinner name="crescent" />
                          </div>
                        )}
                      </div>
                      
                      {/* List of uploaded professional certificates */}
                      <div className="space-y-2">
                        {formData.documents.professional?.map((doc, index) => (
                          <div key={doc.key} className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 p-2 rounded">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="flex-1 truncate pr-2">{doc.name}</span>
                              {doc.verified === false && (
                                <div className="flex items-center gap-1 text-gray-400">
                                  <span>Pending Verification</span>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <IonButton
                                fill="clear"
                                color="primary"
                                size="small"
                                onClick={() => {
                                  setSelectedImage({
                                    url: doc.url || ImageService.getImageUrl(doc.key),
                                    name: doc.name,
                                    type: doc.type
                                  });
                                }}
                              >
                                View
                              </IonButton>
                              <IonButton
                                fill="clear"
                                color="danger"
                                size="small"
                                onClick={() => {
                                  ImageService.deleteImage(doc.key);
                                  setFormData(prev => ({
                                    ...prev,
                                    documents: {
                                      ...prev.documents,
                                      professional: prev.documents.professional?.filter((_, i) => i !== index)
                                    }
                                  }));
                                }}
                              >
                                Remove
                              </IonButton>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Image/Document Preview Modal */}
              <DocumentPreviewModal 
                isOpen={!!selectedImage}
                onClose={() => setSelectedImage(null)}
                document={selectedImage}
              />
              
              {/* Error Message */}
              {error && (
                <div className="mb-4">
                  {error.includes('Unable to connect') || error.includes('Failed to fetch') ? (
                    <NetworkErrorMessage
                      onRetry={() => {
                        setError(null);
                     
                      }}
                    />
                  ) : (
                    <IonAlert
                      isOpen={!!error}
                      onDidDismiss={() => setError(null)}
                      header="Error"
                      message={error}
                      buttons={['OK']}
                    />
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="ion-padding pb-16">
                <div className="navigation-buttons space-y-4">
                  {/* Navigation actions */}
                  <div className="flex gap-4">
                    <IonButton
                      fill="outline"
                      expand="block"
                      color="rose"
                      className="flex-1 border-rose-600 text-rose-600 hover:bg-rose-50 focus:bg-rose-100"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('⬅️ Previous clicked, current step:', currentStep);
                        handlePreviousStep();
                      }}
                      disabled={currentStep === 0 || saving}
                    >
                      Previous
                    </IonButton>

                    <IonButton
                      fill="solid"
                      expand="block"
                      color="rose"
                      className="flex-1 bg-rose-600 border-rose-600 text-white hover:bg-rose-700 focus:bg-rose-700"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('➡️ Next/Submit clicked, current step:', currentStep);

                        if (!validateStep()) {
                          console.log('❌ Step validation failed');
                          return;
                        }

                        // First commit any unsaved changes
                        commitChanges();

                        // Then save current step data
                        const saved = await handleSubmit(currentStep !== 5);
                        if (!saved) {
                          console.log('❌ Failed to save step data');
                          return;
                        }

                        // Reset unsaved changes before moving to next step
                        setUnsavedData({});

                        if (currentStep === 5) {
                          console.log('🎯 Final step - form completed');
                        } else {
                          console.log('➡️ Moving to next step');
                          handleNextStep();
                        }
                      }}
                      disabled={saving}
                    >
                      {saving ? (
                        <div className="flex items-center gap-2">
                          <IonSpinner name="crescent" /> Saving...
                        </div>
                      ) : currentStep === 5 ? (
                        'Complete Profile'
                      ) : (
                        'Next'
                      )}
                    </IonButton>
                  </div>
                  
                </div>
          </div>
          
          {/* Error handling moved to main content area */}
        </div>
      </div>
    </IonContent>
  );
};