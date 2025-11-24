// src/testfront.js
import React, { useState } from 'react';
import { Button, Spin, message, Card, Divider, Row, Col } from 'antd';
import axios from 'axios';

function TestFront() {
  const [loading, setLoading] = useState(false);
  const [loadingSecond, setLoadingSecond] = useState(false); // API PROD
  const [data, setData] = useState(null);
  const [dataSecond, setDataSecond] = useState(null); // API PROD

  // API QA
  const fetchData = async () => {
    setLoading(true); 
    try {
      const response = await axios.get('https://thems-qa.moph.go.th/moph-qa-api/staff/data');
      setData(response.data); 
      message.success('เรียก API QA สำเร็จ');
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการเรียก API QA');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // API PROD
  const fetchDataSecond = async () => {
    setLoadingSecond(true);
    try {
      const response = await axios.get('https://thems.moph.go.th/moph-api/staff/data');
      setDataSecond(response.data); 
      message.success('เรียก API PROD สำเร็จ');
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการเรียก API PROD');
      console.error(error);
    } finally {
      setLoadingSecond(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px', fontFamily:'kanit'}}>
      <Row justify="center">
        <Col span={12}>
          <Card title="API QA" style={{ marginBottom: '20px' }}>
            <Button type="primary" onClick={fetchData} loading={loading}>
              กดเพื่อเรียก API QA
            </Button>
            {loading && <Spin style={{ marginLeft: '20px' }} />}
            {data && (
              <div style={{ marginTop: '20px' }}>
                <h3>ผลลัพธ์จาก API QA:</h3>
                <p>{JSON.stringify(data, null, 2)}</p>
              </div>
            )}
          </Card>
        </Col>

        <Col span={12}>
          <Card title="API PROD" style={{ marginBottom: '20px' }}>
            <Button type="primary" onClick={fetchDataSecond} loading={loadingSecond}>
              กดเพื่อเรียก API PROD
            </Button>
            {loadingSecond && <Spin style={{ marginLeft: '20px' }} />}
            {dataSecond && (
              <div style={{ marginTop: '20px' }}>
                <h3>ผลลัพธ์จาก API PROD:</h3>
                <p>{JSON.stringify(dataSecond, null, 2)}</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>
      <Divider />
    </div>
  );
}

export default TestFront;
