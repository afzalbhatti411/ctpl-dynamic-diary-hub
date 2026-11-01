import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { API_BASE_URL } from './config';

export default function App() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Form submission state
  const [formData, setFormData] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/templates`);
      const data = await response.json();
      setTemplates(data);
      if (data.length > 0) {
        setSelectedTemplate(data[0]);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      Alert.alert('Connection Error', 'Could not connect to Next.js API server.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData({ ...formData, [fieldId]: value });
  };

  const handleSubmit = async () => {
    // Validate required fields from schema definition
    const missingField = selectedTemplate.schema_definition?.find(
      (field: any) => field.required && !formData[field.id]
    );

    if (missingField) {
      Alert.alert('Validation Error', `Please fill in required field: ${missingField.label}`);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_slug: selectedTemplate.form_slug,
          sector_name: formData['sector_name'] || '',
          picket_name: formData['picket_name'] || '',
          submitted_data: formData,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Diary entry submitted successfully!');
        setFormData({});
      } else {
        Alert.alert('Error', result.error || 'Failed to submit diary.');
      }
    } catch (error) {
      console.error('Submission error:', error);
      Alert.alert('Error', 'Network request failed.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 10 }}>Loading CTPL Dynamic Diary Hub...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1, backgroundColor: '#f5f6fa' }}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        
        {/* Modern, Lightweight & Impressive Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerBadge}>
            <Text style={styles.badgeText}>OFFICIAL FIELD PORTAL</Text>
          </View>
          <Text style={styles.headerTitle}>CTPL Dynamic Diary Hub</Text>
          <Text style={styles.headerSubtitle}>City Traffic Police Lahore</Text>
        </View>

        {/* Safe Template Selector Tabs */}
        {templates.length > 0 && (
          <View style={styles.tabContainer}>
            {templates.map((tpl) => (
              <TouchableOpacity
                key={tpl.id}
                style={[
                  styles.tab,
                  selectedTemplate?.id === tpl.id && styles.activeTab,
                ]}
                onPress={() => {
                  setSelectedTemplate(tpl);
                  setFormData({});
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedTemplate?.id === tpl.id && styles.activeTabText,
                  ]}
                >
                  {tpl.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selectedTemplate && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{selectedTemplate.title}</Text>
            <Text style={styles.formDesc}>{selectedTemplate.description}</Text>

            {/* Fully Dynamic JSON Schema Fields */}
            {selectedTemplate.schema_definition?.map((field: any) => (
              <View key={field.id}>
                <Text style={styles.label}>
                  {field.label} {field.required && '*'}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={`Enter ${field.label}`}
                  placeholderTextColor="#888"
                  keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                  value={formData[field.id] || ''}
                  onChangeText={(text) => handleInputChange(field.id, text)}
                />
              </View>
            ))}

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>Submit Diary Entry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ========================================= */}
        {/* DEVELOPER FOOTER CREDIT                    */}
        {/* ========================================= */}
        <View style={styles.developerFooter}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerAgency}>CTPL Dynamic Diary Hub</Text>
          <Text style={styles.footerCredit}>Designed & Developed by</Text>
          <Text style={styles.developerName}>Traffic Warden M. Afzal Bhatti</Text>
          
          <Text style={styles.supportText}>
            For any technical issue, send a screenshot on this WhatsApp number:
          </Text>

          <TouchableOpacity onPress={() => Linking.openURL('https://wa.me/923334080780')}>
            <Text style={styles.footerContact}>📱 +92 333 4080780</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f5f6fa', flexGrow: 1, paddingTop: 40, paddingBottom: 120 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Lightweight & Impressive Header Styles
  headerContainer: {
    alignItems: 'center',
    marginBottom: 25,
    paddingTop: 10,
  },
  headerBadge: {
    backgroundColor: '#e8f4fd',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#d0e8fc',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0984e3',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    color: '#1e272e',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#718093',
    marginTop: 2,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  tabContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' },
  tab: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#dcdde1', borderRadius: 6, margin: 4 },
  activeTab: { backgroundColor: '#273c75' },
  tabText: { fontSize: 13, color: '#2f3640' },
  activeTabText: { color: '#fff', fontWeight: 'bold' },
  formCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  formTitle: { fontSize: 18, fontWeight: 'bold', color: '#2f3640', marginBottom: 5 },
  formDesc: { fontSize: 12, color: '#718093', marginBottom: 15 },
  label: { fontSize: 13, fontWeight: '600', color: '#2f3640', marginTop: 10, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#dcdde1', borderRadius: 6, padding: 10, fontSize: 14, backgroundColor: '#f8f9fa', color: '#2f3640' },
  submitBtn: { backgroundColor: '#273c75', padding: 14, borderRadius: 6, alignItems: 'center', marginTop: 20 },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  
  // Developer Footer Styles
  developerFooter: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 25,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e1e2e6',
  },
  footerDivider: {
    width: '40%',
    height: 2,
    backgroundColor: '#273c75',
    marginBottom: 12,
  },
  footerAgency: {
    fontSize: 11,
    color: '#718093',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  footerCredit: {
    fontSize: 12,
    color: '#57606f',
    marginBottom: 2,
  },
  developerName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#273c75',
    textAlign: 'center',
    marginVertical: 4,
  },
  supportText: {
    fontSize: 11,
    color: '#718093',
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 8,
    paddingHorizontal: 10,
  },
  footerContact: {
    fontSize: 13,
    color: '#0984e3',
    fontWeight: '600',
    marginTop: 2,
  },
});