import { adminDb } from '../firebase-admin';
import { SystemConfig } from '../types';

export async function seedDatabase() {
  try {
    // 1. Seed Config (system_config)
    const configRef = adminDb.collection('config').doc('system_config');
    const configSnap = await configRef.get();

    if (!configSnap.exists) {
      await configRef.set({
        categories: [
          'Pothole',
          'Streetlight Out',
          'Graffiti',
          'Illegal Dumping',
          'Water Leak',
          'Traffic Signal',
          'Sidewalk/Pavement Damage',
          'Other'
        ],
        severityLevels: ['LOW', 'MODERATE', 'HIGH', 'SEVERE'],
        slaHoursByPriority: {
          'LOW': 72,
          'MODERATE': 48,
          'HIGH': 24,
          'SEVERE': 8
        }
      });
      console.log('Seeded config successfully via Admin SDK.');
    } else {
      // Ensure the "Sidewalk/Pavement Damage" category is in the live system_config
      const configData = configSnap.data();
      const currentCategories: string[] = configData?.categories || [];
      if (!currentCategories.includes('Sidewalk/Pavement Damage')) {
        const updatedCategories = [...currentCategories, 'Sidewalk/Pavement Damage'];
        await configRef.update({
          categories: updatedCategories
        });
        console.log('Added "Sidewalk/Pavement Damage" to live system_config categories.');
      }
    }

    // 2. Seed Departments
    const departments = [
      { id: 'dep_public_works', name: 'Public Works', category: 'Pothole', contactInfo: 'publicworks@city.gov' },
      { id: 'dep_sanitation', name: 'Sanitation & Waste', category: 'Illegal Dumping', contactInfo: 'sanitation@city.gov' },
      { id: 'dep_utilities', name: 'Utilities & Water', category: 'Water Leak', contactInfo: 'utilities@city.gov' },
      { id: 'dep_traffic', name: 'Traffic Control', category: 'Traffic Signal', contactInfo: 'traffic@city.gov' },
      { id: 'dep_general', name: 'General Services', category: 'Other', contactInfo: 'cityhall@city.gov' },
      { id: 'dep_streetlight', name: 'Streetlight Maintenance', category: 'Streetlight Out', contactInfo: 'streetlights@city.gov' },
      { id: 'dep_graffiti', name: 'Graffiti Abatement', category: 'Graffiti', contactInfo: 'graffiti@city.gov' },
      { id: 'dep_sidewalk', name: 'Sidewalk & Pavement Repair', category: 'Sidewalk/Pavement Damage', contactInfo: 'sidewalks@city.gov' }
    ];

    for (const dept of departments) {
      const deptRef = adminDb.collection('departments').doc(dept.id);
      await deptRef.set(dept, { merge: true });
    }
    console.log('Seeded and synchronized departments successfully via Admin SDK.');
  } catch (error) {
    console.error('Failed to seed database:', error);
  }
}
