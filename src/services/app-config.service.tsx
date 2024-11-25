// AppConfigService.js

class AppConfigService {
  // Declare the base URL
  baseUrl = 'http://10.0.2.2:5250';

  constructor() {}

  // Method to get the base URL
  getBaseUrl() {
    return this.baseUrl;
  }

  // Method to update the base URL if needed
  setBaseUrl(url: string) {
    this.baseUrl = url;
  }
}

export default new AppConfigService();