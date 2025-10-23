const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test data
const testData = {
  khuVuc: {
    TenKhuVuc: 'Khu vực Test'
  },
  nhaCungCap: {
    TenNCC: 'Nhà cung cấp Test',
    DiaChi: '123 Đường Test',
    SDT: '0123456789'
  },
  khoHang: {
    TenKho: 'Kho Test',
    DiaDiem: '456 Địa điểm Test',
    MaKhuVuc: 1
  },
  sanPham: {
    TenSP: 'Sản phẩm Test',
    DonVi: 'Cái',
    MaNCC: 1,
    MoTa: 'Mô tả sản phẩm test'
  },
  nhapKho: {
    MaKho: 1,
    MaNCC: 1,
    NgayNhap: '2024-01-15',
    GhiChu: 'Nhập hàng test',
    chiTietNhap: [
      {
        MaSP: 1,
        SoLuong: 100,
        GiaNhap: 50000,
        Note: 'Hàng test'
      }
    ]
  },
  xuatKho: {
    MaKho: 1,
    NgayXuat: '2024-01-20',
    GhiChu: 'Xuất hàng test',
    chiTietXuat: [
      {
        MaSP: 1,
        SoLuong: 20,
        GiaXuat: 60000,
        Note: 'Xuất test'
      }
    ]
  }
};

async function testAPI() {
  console.log('🚀 Bắt đầu test API...\n');

  try {
    // 1. Test Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data.message);

    // 2. Test API Documentation
    console.log('\n2. Testing API Documentation...');
    const docsResponse = await axios.get(`${BASE_URL}/docs`);
    console.log('✅ API Documentation loaded');

    // 3. Create Khu Vực
    console.log('\n3. Creating Khu Vực...');
    const khuVucResponse = await axios.post(`${BASE_URL}/khuvuc`, testData.khuVuc);
    console.log('✅ Khu Vực created:', khuVucResponse.data.data.TenKhuVuc);

    // 4. Create Nhà Cung Cấp
    console.log('\n4. Creating Nhà Cung Cấp...');
    const nhaCungCapResponse = await axios.post(`${BASE_URL}/nhacungcap`, testData.nhaCungCap);
    console.log('✅ Nhà Cung Cấp created:', nhaCungCapResponse.data.data.TenNCC);

    // 5. Create Kho Hàng
    console.log('\n5. Creating Kho Hàng...');
    const khoHangResponse = await axios.post(`${BASE_URL}/khohang`, testData.khoHang);
    console.log('✅ Kho Hàng created:', khoHangResponse.data.data.TenKho);

    // 6. Create Sản Phẩm
    console.log('\n6. Creating Sản Phẩm...');
    const sanPhamResponse = await axios.post(`${BASE_URL}/sanpham`, testData.sanPham);
    console.log('✅ Sản Phẩm created:', sanPhamResponse.data.data.TenSP);

    // 7. Create Nhập Kho
    console.log('\n7. Creating Nhập Kho...');
    const nhapKhoResponse = await axios.post(`${BASE_URL}/nhapkho`, testData.nhapKho);
    console.log('✅ Nhập Kho created:', nhapKhoResponse.data.data.MaNhap);

    // 8. Check Tồn Kho
    console.log('\n8. Checking Tồn Kho...');
    const tonKhoResponse = await axios.get(`${BASE_URL}/tonkho`);
    console.log('✅ Tồn Kho:', tonKhoResponse.data.data.length, 'items');

    // 9. Create Xuất Kho
    console.log('\n9. Creating Xuất Kho...');
    const xuatKhoResponse = await axios.post(`${BASE_URL}/xuatkho`, testData.xuatKho);
    console.log('✅ Xuất Kho created:', xuatKhoResponse.data.data.MaXuat);

    // 10. Check Tồn Kho Summary
    console.log('\n10. Checking Tồn Kho Summary...');
    const tonKhoSummaryResponse = await axios.get(`${BASE_URL}/tonkho/summary`);
    console.log('✅ Tồn Kho Summary:', tonKhoSummaryResponse.data.data.summary);

    console.log('\n🎉 Tất cả test đều thành công!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run test
testAPI();
