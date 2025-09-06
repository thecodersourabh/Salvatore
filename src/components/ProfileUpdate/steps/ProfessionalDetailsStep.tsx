import React from 'react';
import {
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonChip,
  IonIcon,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonSkeletonText,
} from '@ionic/react';
import { add, close } from 'ionicons/icons';
import { User } from '../../../types/user';
import { StepProps } from './types';
import '../ProfileUpdate.css';

export const ProfessionalDetailsStep: React.FC<StepProps> = ({ profile, onUpdate, isAnimating }) => {
  const handleInputChange = (
    field: keyof Pick<User, 'experience' | 'skills' | 'certifications'>,
    value: User[typeof field]
  ) => {
    onUpdate({ [field]: value });
  };

  const handleAddSkill = (skillName: string) => {
    if (!skillName || !profile) return;
    
    const currentSkills = profile.skills || [];
    if (!currentSkills.some(skill => skill.name === skillName)) {
      handleInputChange('skills', [
        ...currentSkills,
        { name: skillName, level: 'beginner', yearsOfExperience: 0 }
      ]);
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    if (!profile || !profile.skills) return;
    
    handleInputChange(
      'skills',
      profile.skills.filter(skill => skill.name !== skillToRemove)
    );
  };

  return (
    <div className={`step-content ${isAnimating ? 'animate__animated animate__slideInRight' : ''}`}>
      <IonGrid>
        <IonRow className="ion-justify-content-center">
          <IonCol size="12" sizeMd="8" sizeLg="6">
            <IonList className="ion-no-padding">
              <IonItem className="form-field animated-item">
                <IonLabel position="floating">Years of Experience</IonLabel>
                {profile !== null ? (
                  <IonInput
                    type="number"
                    value={profile.experience}
                    onIonChange={e => handleInputChange('experience', parseInt(e.detail.value || '0'))}
                    min="0"
                    className="animate__animated animate__fadeIn"
                    placeholder="Enter your years of experience"
                  />
                ) : (
                  <IonSkeletonText animated style={{ width: '100%', height: '40px' }} />
                )}
              </IonItem>

              <IonItem className="form-field animated-item">
                <IonLabel position="floating">Add Skills</IonLabel>
                <div className="skills-input-container">
                  <IonInput
                    placeholder="Enter a skill and press Enter"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handleAddSkill((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                    className="animate__animated animate__fadeIn"
                  />
                  <IonButton
                    fill="clear"
                    onClick={e => {
                      const input = e.currentTarget.previousElementSibling as HTMLIonInputElement;
                      handleAddSkill(input.value?.toString() || '');
                      input.value = '';
                    }}
                    className="add-skill-button"
                  >
                    <IonIcon icon={add} />
                  </IonButton>
                </div>
              </IonItem>

              <div className="skills-container ion-padding-vertical">
                {profile?.skills ? (
                  profile.skills.map((skill, index) => (
                    <IonChip
                      key={index}
                      className="skill-chip animate__animated animate__fadeIn"
                      onClick={() => handleRemoveSkill(skill.name)}
                    >
                      <IonLabel>{skill.name}</IonLabel>
                      <IonIcon icon={close} />
                    </IonChip>
                  ))
                ) : (
                  <div className="ion-text-center">
                    <IonSkeletonText animated style={{ width: '60%', height: '32px' }} />
                  </div>
                )}
              </div>

              <IonItem className="form-field animated-item">
                <IonLabel position="floating">Certifications</IonLabel>
                {profile !== null ? (
                  <IonSelect
                    multiple={true}
                    value={profile.certifications}
                    onIonChange={e => handleInputChange('certifications', e.detail.value)}
                    className="animate__animated animate__fadeIn"
                    placeholder="Select your certifications"
                  >
                    <IonSelectOption value="certification1">Certification 1</IonSelectOption>
                    <IonSelectOption value="certification2">Certification 2</IonSelectOption>
                    {/* Add more certification options based on sector */}
                  </IonSelect>
                ) : (
                  <IonSkeletonText animated style={{ width: '100%', height: '40px' }} />
                )}
              </IonItem>

              {profile?.certifications && profile.certifications.length > 0 && (
                <div className="certifications-container ion-padding-vertical">
                  {profile.certifications.map((cert, index) => (
                    <IonChip
                      key={index}
                      className="certification-chip animate__animated animate__fadeIn"
                    >
                      <IonLabel>{cert.name}</IonLabel>
                    </IonChip>
                  ))}
                </div>
              )}
            </IonList>
          </IonCol>
        </IonRow>
      </IonGrid>
    </div>
  );
};
