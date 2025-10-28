const apiClient = require('../utils/apiClient');
const clusteringService = require('./clusteringService');

const generateRecommendations = async (propertyId, userId, filters, algorithm) => {
  try {
    console.log(`Generating recommendations for property ${propertyId}`);

    const propertyResponse = await apiClient.get(`/properties/${propertyId}`);
    const targetProperty = propertyResponse.data;

    const searchFilters = {
      city: targetProperty.city,
      priceMin: Math.floor(targetProperty.price * 0.7),
      priceMax: Math.ceil(targetProperty.price * 1.3),
      type: targetProperty.type,
      ...filters,
    };

    const candidatesResponse = await apiClient.get('/properties', {
      params: searchFilters,
    });

    let allProperties = candidatesResponse.data;

    if (!allProperties.find((p) => p.id === propertyId)) {
      allProperties = [targetProperty, ...allProperties];
    }

    console.log(`Found ${allProperties.length} candidate properties`);

    let recommendations;
    if (algorithm === 'clustering') {
      console.log('Using clustering algorithm');
      recommendations = clusteringService.generateRecommendations(
        targetProperty,
        allProperties,
        5
      );
    } else {
      console.log('Using basic algorithm');
      recommendations = clusteringService.basicRecommendations(
        targetProperty,
        allProperties,
        5
      );
    }

    console.log(`Generated ${recommendations.length} recommendations`);

    return {
      propertyId,
      userId,
      targetProperty: {
        id: targetProperty.id,
        title: targetProperty.title,
        price: targetProperty.price,
      },
      recommendations,
      algorithm,
      count: recommendations.length,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Error generating recommendations:', error.message);
    throw new Error(`Failed to generate recommendations: ${error.message}`);
  }
};

module.exports = { generateRecommendations };