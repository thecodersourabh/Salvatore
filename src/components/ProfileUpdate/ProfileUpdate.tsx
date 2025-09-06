import { useState, useEffect } from 'react';
import {
  IonButton,
  IonIcon,
  IonProgressBar,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSkeletonText,
  IonDatetime,
} from '@ionic/react';
import { close, camera, arrowBack, arrowForward } from 'ionicons/icons';
import { useServiceProvider } from '../../hooks/useServiceProvider';
import './ProfileUpdate.css';
import { User } from '../../types/user';

interface ProfileUpdateProps {
  sector?: string;
}

export const ProfileUpdate: React.FC<ProfileUpdateProps> = ({ sector }) => {
  const {
    profile,
    loading,
    error,
    updateProfile,
    updateAvailability,
    updateServiceAreas,
    updatePricing,
  } = useServiceProvider(sector);

  useEffect(() => {
    console.log(' ProfileUpdate: Profile state updated:', {
      hasProfile: !!profile,
      loading,
      error,
      profileData: profile
    });
  }, [profile, loading, error]);

  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const handleProfileUpdate = (updatedFields: Partial<User>) => {
    if (!profile) return;
    updateProfile(updatedFields);
  };

  const steps = [
    { title: 'Basic Info', completed: false },
    { title: 'Professional Details', completed: false },
    { title: 'Availability', completed: false },
    { title: 'Service Areas', completed: false },
    { title: 'Pricing', completed: false },
  ];

  const calculateProgress = () => {
    const completedSteps = steps.filter(step => step.completed).length;
    return (completedSteps / steps.length) * 100;
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      steps[currentStep].completed = true;
      setProgress(calculateProgress());
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && profile) {
      try {
        // TODO: Implement image upload logic
        // const imageUrl = await uploadImage(file);
        handleProfileUpdate({
          ...profile,
          //avatar: imageUrl
        });
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="step-content-wrapper">
            <div className="profile-image-container">
              {profile?.avatar ? (
                <img src={profile.avatar} alt="Profile" className="profile-image" />
              ) : (
                <div className="profile-image-placeholder">
                  <IonIcon icon={camera} style={{ fontSize: '48px', color: 'var(--ion-color-medium)' }} />
                </div>
              )}
              <div className="profile-image-overlay">
                <IonButton 
                  className="image-upload-button" 
                  fill="clear" 
                  color="light"
                  onClick={() => document.getElementById('imageUpload')?.click()}
                >
                  <IonIcon slot="start" icon={camera} />
                  Change Photo
                </IonButton>
              </div>
              <input
                type="file"
                id="imageUpload"
                hidden
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
            
            <IonList className="form-fields-list">
              <IonItem 
                className={`custom-item animate__animated animate__fadeInUp ${profile?.displayName ? 'item-has-value' : ''}`} 
                lines="none"
              >
                <div className="input-wrapper">
                  <IonLabel>Display Name</IonLabel>
                  <IonInput
                    className="custom-input"
                    value={profile?.displayName}
                    placeholder="Enter your display name"
                    onIonChange={e => {
                      if (!profile) return;
                      handleProfileUpdate({
                        displayName: e.detail.value || profile.displayName
                      });
                    }}
                    onIonFocus={e => {
                      e.target.closest('ion-item')?.classList.add('item-has-focus');
                    }}
                    onIonBlur={e => {
                      e.target.closest('ion-item')?.classList.remove('item-has-focus');
                    }}
                  />
                </div>
              </IonItem>
              
              <IonItem className="custom-item animate__animated animate__fadeInUp" lines="none">
                <IonLabel position="floating">Name</IonLabel>
                <IonInput
                  className="custom-input"
                  value={profile?.name}
                  placeholder="Enter your full name"
                  onIonChange={e => {
                    if (!profile) return;
                    handleProfileUpdate({
                      name: e.detail.value || profile.name
                    });
                  }}
                />
              </IonItem>
              
              <IonItem className="custom-item animate__animated animate__fadeInUp" lines="none">
                <IonLabel position="floating">Description</IonLabel>
                <IonInput
                  className="custom-textarea"
                  value={profile?.description}
                  placeholder="Tell us about yourself and your services"
                  onIonChange={e => {
                    if (!profile) return;
                    handleProfileUpdate({
                      description: e.detail.value || profile.description
                    });
                  }}
                />
              </IonItem>

              <IonItem className="custom-item animate__animated animate__fadeInUp" lines="none">
                <IonLabel position="floating">Phone</IonLabel>
                <IonInput
                  className="custom-input"
                  type="tel"
                  value={profile?.phone}
                  placeholder="Enter your contact number"
                  onIonChange={e => {
                    if (!profile) return;
                    handleProfileUpdate({
                      phone: e.detail.value || profile.phone
                    });
                  }}
                />
              </IonItem>
            </IonList>
          </div>
        );

      case 1:
        return (
          <div className="step-content-wrapper">
            <IonList className="form-fields-list">
              <IonItem className="custom-item animate__animated animate__fadeInUp" lines="none">
                <IonLabel position="floating">Years of Experience</IonLabel>
                <IonInput
                  className="custom-input"
                  type="number"
                  min="0"
                  max="50"
                  value={profile?.experience}
                  placeholder="Enter years of experience"
                  onIonChange={e => {
                    if (!profile) return;
                    const newValue = e.detail.value ? Number(e.detail.value) : 0;
                    handleProfileUpdate({
                      experience: newValue
                    });
                  }}
                />
              </IonItem>

              <IonItem className="custom-item animate__animated animate__fadeInUp" lines="none">
                <IonLabel position="floating">Specializations</IonLabel>
                <IonSelect
                  className="custom-select"
                  multiple={true}
                  value={profile?.specializations}
                  placeholder="Select your specializations"
                  onIonChange={e => {
                    if (!profile) return;
                    handleProfileUpdate({
                      specializations: e.detail.value || []
                    });
                  }}
                >
                  {sector === 'beauty' && (
                    <>
                      <IonSelectOption value="hair">Hair Styling</IonSelectOption>
                      <IonSelectOption value="makeup">Makeup</IonSelectOption>
                      <IonSelectOption value="nails">Nail Care</IonSelectOption>
                      <IonSelectOption value="skincare">Skincare</IonSelectOption>
                      <IonSelectOption value="massage">Massage</IonSelectOption>
                    </>
                  )}
                  {sector === 'health' && (
                    <>
                      <IonSelectOption value="physiotherapy">Physiotherapy</IonSelectOption>
                      <IonSelectOption value="nutrition">Nutrition</IonSelectOption>
                      <IonSelectOption value="personalTraining">Personal Training</IonSelectOption>
                      <IonSelectOption value="yoga">Yoga</IonSelectOption>
                      <IonSelectOption value="meditation">Meditation</IonSelectOption>
                    </>
                  )}
                </IonSelect>
              </IonItem>

              {profile?.skills?.map((skill, index) => (
                <IonItem key={index} className="custom-item skill-item animate__animated animate__fadeInUp" lines="none">
                  <IonLabel position="floating">{skill.name}</IonLabel>
                  <div className="skill-controls">
                    <IonSelect
                      className="custom-select"
                      value={skill.level}
                      placeholder="Select skill level"
                      onIonChange={e => {
                        if (!profile) return;
                        const updatedSkills = [...(profile.skills || [])];
                        updatedSkills[index] = {
                          ...skill,
                          level: e.detail.value
                        };
                        handleProfileUpdate({
                          skills: updatedSkills
                        });
                      }}
                    >
                      <IonSelectOption value="beginner">Beginner</IonSelectOption>
                      <IonSelectOption value="intermediate">Intermediate</IonSelectOption>
                      <IonSelectOption value="advanced">Advanced</IonSelectOption>
                      <IonSelectOption value="expert">Expert</IonSelectOption>
                    </IonSelect>
                    <IonInput
                      className="custom-input year-input"
                      type="number"
                      min="0"
                      max="30"
                      value={skill.yearsOfExperience}
                      placeholder="Years"
                      onIonChange={e => {
                        if (!profile) return;
                        const updatedSkills = [...(profile.skills || [])];
                        updatedSkills[index] = {
                          ...skill,
                          yearsOfExperience: Number(e.detail.value) || 0
                        };
                        handleProfileUpdate({
                          skills: updatedSkills
                        });
                      }}
                    />
                  </div>
                </IonItem>
              ))}
            </IonList>
          </div>
        );

      case 2:
        return (
          <div className="ion-padding">
            <IonList>
              <IonItem>
                <IonLabel>Available on Weekdays</IonLabel>
                <IonButton
                  fill={profile?.availability?.weekdays ? 'solid' : 'outline'}
                  onClick={() => {
                    if (!profile) return;
                    updateAvailability({
                      weekdays: !(profile.availability?.weekdays ?? false),
                      weekends: profile.availability?.weekends ?? false,
                      hours: profile.availability?.hours ?? { start: '09:00', end: '17:00' }
                    });
                  }}
                >
                  {profile?.availability?.weekdays ? 'Yes' : 'No'}
                </IonButton>
              </IonItem>
              <IonItem>
                <IonLabel>Available on Weekends</IonLabel>
                <IonButton
                  fill={profile?.availability?.weekends ? 'solid' : 'outline'}
                  onClick={() => {
                    if (!profile) return;
                    updateAvailability({
                      weekdays: profile.availability?.weekdays ?? false,
                      weekends: !(profile.availability?.weekends ?? false),
                      hours: profile.availability?.hours ?? { start: '09:00', end: '17:00' }
                    });
                  }}
                >
                  {profile?.availability?.weekends ? 'Yes' : 'No'}
                </IonButton>
              </IonItem>
              <IonItem>
                <IonLabel>Working Hours</IonLabel>
                <IonDatetime
                  presentation="time"
                  preferWheel={true}
                  value={profile?.availability?.hours?.start}
                  onIonChange={e => {
                    if (!profile) return;
                    const hours = profile.availability?.hours ?? { start: '09:00', end: '17:00' };
                    const newValue = Array.isArray(e.detail.value) ? e.detail.value[0] : e.detail.value;
                    updateAvailability({
                      weekdays: profile.availability?.weekdays ?? false,
                      weekends: profile.availability?.weekends ?? false,
                      hours: {
                        ...hours,
                        start: newValue || hours.start
                      }
                    });
                  }}
                />
                <IonDatetime
                  presentation="time"
                  preferWheel={true}
                  value={profile?.availability?.hours?.end}
                  onIonChange={e => {
                    if (!profile) return;
                    const hours = profile.availability?.hours ?? { start: '09:00', end: '17:00' };
                    const newValue = Array.isArray(e.detail.value) ? e.detail.value[0] : e.detail.value;
                    updateAvailability({
                      weekdays: profile.availability?.weekdays ?? false,
                      weekends: profile.availability?.weekends ?? false,
                      hours: {
                        ...hours,
                        end: newValue || hours.end
                      }
                    });
                  }}
                />
              </IonItem>
            </IonList>
          </div>
        );

      case 3:
        return (
          <div className="ion-padding">
            <IonList>
              <IonItem>
                <IonLabel>Service Locations</IonLabel>
                <IonSelect
                  multiple={true}
                  value={profile?.serviceAreas?.locations}
                  onIonChange={e => {
                    if (!profile) return;
                    updateServiceAreas({
                      locations: e.detail.value || []
                    });
                  }}
                >
                  {/* Add location options */}
                </IonSelect>
              </IonItem>
              <IonItem>
                <IonLabel>Preferred Service Locations</IonLabel>
                {profile?.serviceAreas?.locations?.map((location, index) => (
                  <IonButton key={index} fill="solid" className="location-pill">
                    {location.city}, {location.state}
                    <IonIcon
                      icon={close}
                      onClick={() => {
                        if (!profile) return;
                        const locations = [...(profile.serviceAreas?.locations || [])];
                        locations.splice(index, 1);
                        updateServiceAreas({ locations });
                      }}
                    />
                  </IonButton>
                ))}
              </IonItem>
            </IonList>
          </div>
        );

      case 4:
        return (
          <div className="ion-padding">
            <IonList>
              <IonItem>
                <IonLabel position="floating">Base Rate</IonLabel>
                <IonInput
                  type="number"
                  value={profile?.pricing?.baseRate}
                  onIonChange={e => {
                    if (!profile) return;
                    const pricing = profile.pricing ?? {
                      model: 'hourly' as const,
                      baseRate: 0,
                      currency: 'USD'
                    };
                    updatePricing({
                      ...pricing,
                      baseRate: Number(e.detail.value) || pricing.baseRate
                    });
                  }}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="floating">Pricing Model</IonLabel>
                <IonSelect
                  value={profile?.pricing?.model}
                  onIonChange={e => {
                    if (!profile) return;
                    const pricing = profile.pricing ?? {
                      model: 'hourly' as const,
                      baseRate: 0,
                      currency: 'USD'
                    };
                    updatePricing({
                      ...pricing,
                      model: e.detail.value
                    });
                  }}
                >
                  <IonSelectOption value="hourly">Per Hour</IonSelectOption>
                  <IonSelectOption value="fixed">Fixed Rate</IonSelectOption>
                  <IonSelectOption value="project">Per Project</IonSelectOption>
                </IonSelect>
              </IonItem>
              <IonItem>
                <IonLabel position="floating">Currency</IonLabel>
                <IonSelect
                  value={profile?.pricing?.currency}
                  onIonChange={e => {
                    if (!profile) return;
                    const pricing = profile.pricing ?? {
                      model: 'hourly' as const,
                      baseRate: 0,
                      currency: 'USD'
                    };
                    updatePricing({
                      ...pricing,
                      currency: e.detail.value
                    });
                  }}
                >
                  <IonSelectOption value="USD">USD ($)</IonSelectOption>
                  <IonSelectOption value="EUR">EUR (€)</IonSelectOption>
                  <IonSelectOption value="GBP">GBP (£)</IonSelectOption>
                </IonSelect>
              </IonItem>
            </IonList>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="profile-update-container">
        <IonSkeletonText animated style={{ width: '60%', height: '32px', margin: '24px auto' }} />
        <IonList>
          {[1, 2, 3].map((i) => (
            <IonItem key={i}>
              <IonSkeletonText animated style={{ width: '100%', height: '60px' }} />
            </IonItem>
          ))}
        </IonList>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-update-container ion-padding">
        <div className="error-container ion-text-center">
          <IonIcon icon={close} color="danger" style={{ fontSize: '48px' }} />
          <h2>Error</h2>
          <p>{error.message}</p>
          <IonButton onClick={() => window.location.reload()}>Try Again</IonButton>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-update-container ion-padding">
        <div className="error-container ion-text-center">
          <h2>No Profile Data</h2>
          <p>Please try refreshing the page or contact support.</p>
          <IonButton onClick={() => window.location.reload()}>Refresh</IonButton>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-update-container animate__animated animate__fadeIn">
      <IonProgressBar 
        value={progress / 100} 
        className="step-progress animate__animated animate__slideInRight"
      />
      <h1 className="step-title animate__animated animate__slideInRight">
        {steps[currentStep].title}
      </h1>
      <div className="step-content animate__animated animate__fadeIn">
        {renderStep()}
      </div>
      <div className="step-navigation">
        <IonButton
          className="prev-button"
          fill="clear"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <IonIcon slot="start" icon={arrowBack} />
          Previous
        </IonButton>
        <IonButton
          className="next-button"
          fill="solid"
          onClick={handleNext}
          disabled={currentStep === steps.length - 1}
        >
          Next
          <IonIcon slot="end" icon={arrowForward} />
        </IonButton>
      </div>
    </div>
  );
};
