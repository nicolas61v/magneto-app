// src/services/firestore.ts
import { db } from '@/services/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { CV, CVData } from '@/types/cv';

// Colección de CVs en Firestore
const CV_COLLECTION = 'cvs';

export const firestoreService = {
  // Crear un nuevo CV en Firestore
  async createCV(cvData: Omit<CV, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, CV_COLLECTION), {
        ...cvData,
        createdAt: Timestamp.now(),
      });
      
      console.log('CV guardado en Firestore con ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error guardando CV en Firestore:', error);
      throw new Error('Error al guardar CV en la base de datos');
    }
  },

  // Actualizar un CV existente
  async updateCV(id: string, updates: Partial<CV>): Promise<void> {
    try {
      const docRef = doc(db, CV_COLLECTION, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      
      console.log('CV actualizado en Firestore:', id);
    } catch (error) {
      console.error('Error actualizando CV en Firestore:', error);
      throw new Error('Error al actualizar CV en la base de datos');
    }
  },

  // Obtener un CV por ID
  async getCV(id: string): Promise<CV | null> {
    try {
      const docRef = doc(db, CV_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as CV;
      }
      
      return null;
    } catch (error) {
      console.error('Error obteniendo CV de Firestore:', error);
      throw new Error('Error al obtener CV de la base de datos');
    }
  },

  // Obtener todos los CVs (para historial)
  async getAllCVs(): Promise<CV[]> {
    try {
      const q = query(collection(db, CV_COLLECTION), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const cvs: CV[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        cvs.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as CV);
      });
      
      return cvs;
    } catch (error) {
      console.error('Error obteniendo CVs de Firestore:', error);
      throw new Error('Error al obtener CVs de la base de datos');
    }
  },

  // Actualizar solo el texto extraído
  async updateExtractedText(id: string, extractedText: string): Promise<void> {
    await this.updateCV(id, {
      extractedText,
      status: 'processing'
    });
  },

  // Actualizar solo los datos procesados
  async updateProcessedData(id: string, processedData: CVData): Promise<void> {
    await this.updateCV(id, {
      processedData,
      status: 'completed'
    });
  },

  // Marcar CV como error
  async markAsError(id: string, errorMessage: string): Promise<void> {
    await this.updateCV(id, {
      status: 'error',
      errorMessage
    });
  }
};