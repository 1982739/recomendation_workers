const kmeans = require('ml-kmeans');

class ClusteringService {
  normalize(value, min, max) {
    if (max === min) return 0.5;
    return (value - min) / (max - min);
  }

  prepareFeatures(properties) {
    const prices = properties.map((p) => p.price);
    const areas = properties.map((p) => p.area || 0);
    const bedrooms = properties.map((p) => p.bedrooms || 0);
    const bathrooms = properties.map((p) => p.bathrooms || 0);

    const priceMin = Math.min(...prices);
    const priceMax = Math.max(...prices);
    const areaMin = Math.min(...areas);
    const areaMax = Math.max(...areas);
    const bedroomsMin = Math.min(...bedrooms);
    const bedroomsMax = Math.max(...bedrooms);
    const bathroomsMin = Math.min(...bathrooms);
    const bathroomsMax = Math.max(...bathrooms);

    return properties.map((property) => [
      this.normalize(property.price, priceMin, priceMax),
      this.normalize(property.area || 0, areaMin, areaMax),
      this.normalize(property.bedrooms || 0, bedroomsMin, bedroomsMax),
      this.normalize(property.bathrooms || 0, bathroomsMin, bathroomsMax),
      property.type === 'house' ? 1 : 0,
      property.type === 'apartment' ? 1 : 0,
    ]);
  }

  euclideanDistance(a, b) {
    return Math.sqrt(
      a.reduce((sum, val, idx) => sum + Math.pow(val - b[idx], 2), 0)
    );
  }

  generateRecommendations(targetProperty, allProperties, topN = 3) {
    try {
      const features = this.prepareFeatures(allProperties);
      const k = Math.min(Math.max(2, Math.floor(allProperties.length / 3)), 10);
      const result = kmeans(features, k, {
        initialization: 'kmeans++',
        maxIterations: 100,
      });

      const targetIndex = allProperties.findIndex(
        (p) => p.id === targetProperty.id
      );
      const targetCluster = result.clusters[targetIndex];

      const sameClusterProperties = allProperties.filter(
        (p, idx) =>
          result.clusters[idx] === targetCluster && p.id !== targetProperty.id
      );

      if (sameClusterProperties.length < topN) {
        const targetFeatures = features[targetIndex];
        const propertiesWithDistance = allProperties
          .filter((p) => p.id !== targetProperty.id)
          .map((property, idx) => ({
            ...property,
            distance: this.euclideanDistance(features[idx], targetFeatures),
          }));

        propertiesWithDistance.sort((a, b) => a.distance - b.distance);
        return propertiesWithDistance.slice(0, topN).map((p) => {
          delete p.distance;
          return p;
        });
      }

      return sameClusterProperties.slice(0, topN);
    } catch (error) {
      console.error('Error in clustering:', error);
      return;
    }
  }
}

module.exports = new ClusteringService();