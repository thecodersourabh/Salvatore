import {
  IonContent,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonChip,
  IonButton,
  IonIcon,
  IonList
} from '@ionic/react';
import { add, close } from 'ionicons/icons';
import { useState } from 'react';

interface ProviderDetailsFormProps {
  data: {
    displayName: string;
    description: string;
    phoneNumber: string;
    experience: number;
    skills: Array<{
      name: string;
      level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
      yearsOfExperience: number;
    }>;
    certifications: string[];
    serviceAreas: string[];
  };
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export const ProviderDetailsForm = ({ data, onUpdate, onNext, onBack }: ProviderDetailsFormProps) => {
  const [newSkill, setNewSkill] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [newServiceArea, setNewServiceArea] = useState('');

  const handleAddSkill = () => {
    if (newSkill && !data.skills.some(s => s.name === newSkill)) {
      onUpdate({ 
        ...data, 
        skills: [...data.skills, { 
          name: newSkill, 
          level: 'beginner', 
          yearsOfExperience: 0 
        }]
      });
      setNewSkill('');
    }
  };

  const handleAddCertification = () => {
    if (newCertification && !data.certifications.includes(newCertification)) {
      onUpdate({ ...data, certifications: [...data.certifications, newCertification] });
      setNewCertification('');
    }
  };

  const handleAddServiceArea = () => {
    if (newServiceArea && !data.serviceAreas.includes(newServiceArea)) {
      onUpdate({ ...data, serviceAreas: [...data.serviceAreas, newServiceArea] });
      setNewServiceArea('');
    }
  };

  return (
    <IonContent className="ion-padding">
      <IonCard>
        <IonCardContent>
          <IonList>
            <IonItem>
              <IonLabel position="floating">Display Name</IonLabel>
              <IonInput
                value={data.displayName}
                onIonChange={e => onUpdate({ ...data, displayName: e.detail.value! })}
                required
              />
            </IonItem>

            <IonItem>
              <IonLabel position="floating">Description</IonLabel>
              <IonTextarea
                value={data.description}
                onIonChange={e => onUpdate({ ...data, description: e.detail.value! })}
                rows={4}
                required
              />
            </IonItem>

            <IonItem>
              <IonLabel position="floating">Phone Number</IonLabel>
              <IonInput
                type="tel"
                value={data.phoneNumber}
                onIonChange={e => onUpdate({ ...data, phoneNumber: e.detail.value! })}
                required
              />
            </IonItem>

            <IonItem>
              <IonLabel position="floating">Years of Experience</IonLabel>
              <IonInput
                type="number"
                value={data.experience}
                onIonChange={e => onUpdate({ ...data, experience: parseInt(e.detail.value!) || 0 })}
                min="0"
                required
              />
            </IonItem>

            {/* Skills */}
            <IonItem>
              <IonLabel position="floating">Add Skills</IonLabel>
              <IonInput
                value={newSkill}
                onIonChange={e => setNewSkill(e.detail.value!)}
                onKeyPress={e => e.key === 'Enter' && handleAddSkill()}
              />
              <IonButton slot="end" fill="clear" onClick={handleAddSkill}>
                <IonIcon icon={add} />
              </IonButton>
            </IonItem>
            <div className="px-4 py-2 flex flex-wrap gap-2">
              {data.skills.map((skill, index) => (
                <IonChip key={index} onClick={() => {
                  onUpdate({ ...data, skills: data.skills.filter((_, i) => i !== index) });
                }}>
                  <IonLabel>{skill.name} ({skill.level})</IonLabel>
                  <IonIcon icon={close} />
                </IonChip>
              ))}
            </div>

            {/* Certifications */}
            <IonItem>
              <IonLabel position="floating">Add Certifications</IonLabel>
              <IonInput
                value={newCertification}
                onIonChange={e => setNewCertification(e.detail.value!)}
                onKeyPress={e => e.key === 'Enter' && handleAddCertification()}
              />
              <IonButton slot="end" fill="clear" onClick={handleAddCertification}>
                <IonIcon icon={add} />
              </IonButton>
            </IonItem>
            <div className="px-4 py-2 flex flex-wrap gap-2">
              {data.certifications.map((cert, index) => (
                <IonChip key={index} onClick={() => {
                  onUpdate({ ...data, certifications: data.certifications.filter((_, i) => i !== index) });
                }}>
                  <IonLabel>{cert}</IonLabel>
                  <IonIcon icon={close} />
                </IonChip>
              ))}
            </div>

            {/* Service Areas */}
            <IonItem>
              <IonLabel position="floating">Add Service Areas</IonLabel>
              <IonInput
                value={newServiceArea}
                onIonChange={e => setNewServiceArea(e.detail.value!)}
                onKeyPress={e => e.key === 'Enter' && handleAddServiceArea()}
              />
              <IonButton slot="end" fill="clear" onClick={handleAddServiceArea}>
                <IonIcon icon={add} />
              </IonButton>
            </IonItem>
            <div className="px-4 py-2 flex flex-wrap gap-2">
              {data.serviceAreas.map((area, index) => (
                <IonChip key={index} onClick={() => {
                  onUpdate({ ...data, serviceAreas: data.serviceAreas.filter((_, i) => i !== index) });
                }}>
                  <IonLabel>{area}</IonLabel>
                  <IonIcon icon={close} />
                </IonChip>
              ))}
            </div>
          </IonList>

          <div className="flex justify-between mt-6">
            <IonButton fill="outline" onClick={onBack}>
              Back
            </IonButton>
            <IonButton onClick={onNext}>
              Next
            </IonButton>
          </div>
        </IonCardContent>
      </IonCard>
    </IonContent>
  );
};
