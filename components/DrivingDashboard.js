import React, { Component, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

class DrivingDashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ishonchnomaDocuments: [],
      isVisible: false,
    };
  }

  // Add function to load ishonchnoma documents from checker dashboard
  loadSharedIshonchnomaDocuments = () => {
    // Get documents from shared storage
    const sharedDocumentsJson = localStorage.getItem('sharedIshonchnomaDocuments');
    if (sharedDocumentsJson) {
      const sharedDocuments = JSON.parse(sharedDocumentsJson);
      // Update state with the shared documents
      this.setState({ ishonchnomaDocuments: sharedDocuments });
    }
  }

  componentDidMount() {
    // Initial load
    this.loadSharedIshonchnomaDocuments();
    
    // Listen for future updates
    const handleDocumentsUpdated = (event) => {
      this.setState({ ishonchnomaDocuments: event.detail.documents });
    };
    
    document.addEventListener('ishonchnomaDocumentsUpdated', handleDocumentsUpdated);
    
    // Clean up listener
    return () => {
      document.removeEventListener('ishonchnomaDocumentsUpdated', handleDocumentsUpdated);
    };
  }

  componentDidMount() {
    const selectedDashboard = localStorage.getItem('selectedDashboard');
    const isVisible = localStorage.getItem('drivingDashboardVisibility') === 'true';
    
    // Update visibility based on selection
    if (selectedDashboard === 'operatordashboard' && isVisible) {
      this.setState({ isVisible: true });
    }
  }

  render() {
    if (!this.state.isVisible) {
      return null;
    }

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Driving Dashboard</Text>
        {/* Render ishonchnoma documents or other content here */}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

export default DrivingDashboard;