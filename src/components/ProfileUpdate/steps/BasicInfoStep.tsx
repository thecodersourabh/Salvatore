import React from 'react';
import {
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonSkeletonText,
  IonText,
} from '@ionic/react';
import { camera } from 'ionicons/icons';
import { User } from '../../../types/user';
import { StepProps } from './types';
import '../ProfileUpdate.css';

export const BasicInfoStep: React.FC<StepProps> = ({ profile, onUpdate, isAnimating }) => {
  const handleInputChange = (field: keyof Pick<User, 'displayName' | 'avatar' | 'description'>, value: string) => {
    onUpdate({ [field]: value });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // TODO: Implement image upload logic
      // const imageUrl = await uploadImage(file);
      // handleInputChange('avatar', imageUrl);
    }
  };

  return (
    <div className={`step-content ${isAnimating ? 'animate__animated animate__slideInRight' : ''}`}>
      <IonGrid className="ion-padding">
        <IonRow className="ion-justify-content-center">
          <IonCol size="12" sizeMd="8" sizeLg="6">
            <div className="form-group">
              <h3 className="form-group-title">Profile Information</h3>
              <div className="ion-text-center ion-margin-bottom">
                {profile?.avatar ? (
                  <div className="profile-image-container">
                    <img
                      src={profile.avatar}
                      alt="Profile"
                      className="profile-image animate__animated animate__fadeIn"
                    />
                    <div className="profile-image-overlay">
                      <IonButton 
                        fill="clear" 
                        onClick={() => document.getElementById('imageUpload')?.click()}
                        className="image-upload-button"
                      >
                        <IonIcon slot="icon-only" icon={camera} />
                      </IonButton>
                    </div>
                  </div>
                ) : (
                  <div className="profile-image-placeholder">
                    <IonButton 
                      fill="clear" 
                      onClick={() => document.getElementById('imageUpload')?.click()}
                      className="image-upload-button"
                    >
                      <IonIcon slot="start" icon={camera} />
                      <IonText color="medium">Upload Profile Picture</IonText>
                    </IonButton>
                  </div>
                )}
                <input
                  type="file"
                  id="imageUpload"
                  hidden
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
              <IonList className="ion-no-padding">
                <IonItem className="form-field animated-item" lines="none">
                  <IonLabel position="stacked" className="required-field">
                    Display Name
                  </IonLabel>
                  {profile !== null ? (
                    <IonInput
                      value={profile.displayName}
                      onIonChange={e => handleInputChange('displayName', e.detail.value || '')}
                      className="custom-input"
                      placeholder="Enter your display name"
                    />
                  ) : (
                    <IonSkeletonText animated style={{ width: '100%', height: '40px' }} />
                  )}
                </IonItem>

                <IonItem className="form-field animated-item" lines="none">
                  <IonLabel position="stacked">Description</IonLabel>
                  {profile !== null ? (
                    <IonTextarea
                      value={profile.description}
                      onIonChange={e => handleInputChange('description', e.detail.value || '')}
                      className="custom-textarea"
                      rows={4}
                      placeholder="Tell us about yourself..."
                      autoGrow={true}
                    />
                  ) : (
                    <IonSkeletonText animated style={{ width: '100%', height: '100px' }} />
                  )}
                  <div className="field-description">
                    Write a brief description about yourself that will be visible to others.
                  </div>
                </IonItem>
              </IonList>
            </div>
          </IonCol>
        </IonRow>
      </IonGrid>
    </div>
  );
};