import axios from 'axios';
import FormData from 'form-data';
import { createReadStream } from 'fs';

async function testUpload() {
  try {
    const formData = new FormData();
    formData.append('doc_type', '10TH_MARKSHEET');
    formData.append('file', createReadStream('../testing_docs/test_scenarios/11_Amit_Kumar/10th_marksheet.pdf'), {
      filename: '10th_marksheet.pdf',
      contentType: 'application/pdf',
    });

    const url = 'https://credixa-risk-engine.onrender.com/validate-document?expected_name=Amit%20Kumar';
    console.log(`Sending to ${url}...`);

    const response = await axios.post(url, formData, {
      headers: {
        ...formData.getHeaders(),
        'x-api-key': 'credixa_internal_engine_key_2026',
      },
    });

    console.log('Success:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('Error Response Data:', error.response.data);
      console.error('Error Response Status:', error.response.status);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testUpload();
