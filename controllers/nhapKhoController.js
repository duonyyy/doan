// File: controllers/nhapKhoController.js

// CHỈ import hàm getDbFromRequest và Op
const { getDbFromRequest } = require('../config/db.config'); // Giả định đường dẫn này đúng
const { Op } = require('sequelize');

// Tên Models (sẽ được lấy từ db.models)
const ModelNames = [
  'NhapKho',
  'ChiTietNhap',
  'KhoHang',
  'NhaCungCap',
  'SanPham',
  'TonKho',
  'KhuVuc',
];

// Lấy các Models cần thiết từ đối tượng DB đã định tuyến
const getModels = (db) => {
  const models = {};
  for (const name of ModelNames) {
    if (!db.models[name]) {
      throw new Error(`Model ${name} không tồn tại trên Shard/Master.`);
    }
    models[name] = db.models[name];
  }
  return models;
};

// ----------------------------------------------------------------------
// GET /api/nhapkho - Lấy danh sách nhập kho
// ----------------------------------------------------------------------
const getAllNhapKho = async (req, res) => {
  try {
    // 1. ĐỊNH TUYẾN: Lấy kết nối DB (Ưu tiên MaKhuVuc/ShardKey, nếu không có sẽ dùng Master)
    const db = await getDbFromRequest(req);
    if (!db) return res.status(500).json({ message: 'Lỗi cấu hình Shard' });

    // 2. LẤY MODELS TỪ CONNECTION
    const { NhapKho, KhoHang, NhaCungCap, ChiTietNhap, SanPham, KhuVuc } =
      getModels(db);

    const {
      page = 1,
      limit = 10,
      search,
      MaKho,
      MaNCC,
      fromDate,
      toDate,
    } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (search) {
      whereClause.GhiChu = { [Op.like]: `%${search}%` };
    }
    if (MaKho) {
      whereClause.MaKho = MaKho;
    }
    if (MaNCC) {
      whereClause.MaNCC = MaNCC;
    }
    if (fromDate && toDate) {
      whereClause.NgayNhap = {
        [Op.between]: [fromDate, toDate],
      };
    }

    // 3. THỰC HIỆN TRUY VẤN
    const { count, rows } = await NhapKho.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [
        ['NgayNhap', 'DESC'],
        ['MaNhap', 'DESC'],
      ],
      include: [
        {
          model: KhoHang,
          as: 'KhoHang',
          include: [
            {
              model: KhuVuc,
              as: 'KhuVuc',
            },
          ],
        },
        {
          model: NhaCungCap,
          as: 'NhaCungCap',
        },
        {
          model: ChiTietNhap,
          as: 'ChiTietNhaps',
          include: [
            {
              model: SanPham,
              as: 'SanPham',
            },
          ],
        },
      ],
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Lỗi getAllNhapKho:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách nhập kho',
      error: error.message,
    });
  }
};

// ----------------------------------------------------------------------
// GET /api/nhapkho/:id - Lấy nhập kho theo ID
// ----------------------------------------------------------------------
const getNhapKhoById = async (req, res) => {
  try {
    // 1. ĐỊNH TUYẾN: Cần có MaKhuVuc/ShardKey trong request để định tuyến chính xác.
    const db = await getDbFromRequest(req);
    if (!db) return res.status(500).json({ message: 'Lỗi cấu hình Shard' });

    // 2. LẤY MODELS TỪ CONNECTION
    const { NhapKho, KhoHang, NhaCungCap, ChiTietNhap, SanPham, KhuVuc } =
      getModels(db);

    const { id } = req.params;

    // 3. THỰC HIỆN TRUY VẤN
    const nhapKho = await NhapKho.findByPk(id, {
      include: [
        {
          model: KhoHang,
          as: 'KhoHang',
          include: [
            {
              model: KhuVuc,
              as: 'KhuVuc',
            },
          ],
        },
        {
          model: NhaCungCap,
          as: 'NhaCungCap',
        },
        {
          model: ChiTietNhap,
          as: 'ChiTietNhaps',
          include: [
            {
              model: SanPham,
              as: 'SanPham',
            },
          ],
        },
      ],
    });

    if (!nhapKho) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu nhập kho',
      });
    }

    res.json({
      success: true,
      data: nhapKho,
    });
  } catch (error) {
    console.error('Lỗi getNhapKhoById:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin nhập kho',
      error: error.message,
    });
  }
};

// ----------------------------------------------------------------------
// POST /api/nhapkho - Tạo mới phiếu nhập kho (SỬ DỤNG STORED PROCEDURE)
// ----------------------------------------------------------------------
const createNhapKho = async (req, res) => {
  // 1. ĐỊNH TUYẾN: Lấy kết nối DB (Master/Shard)
  const db = await getDbFromRequest(req);
  if (!db) return res.status(500).json({ message: 'Lỗi cấu hình Shard' });

  try {
    const { MaKho, MaNCC, NgayNhap, GhiChu, chiTietNhap } = req.body;

    // Validation cơ bản
    if (
      !MaKho ||
      !MaNCC ||
      !NgayNhap ||
      !chiTietNhap ||
      chiTietNhap.length === 0
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'Thông tin phiếu nhập không hợp lệ.',
        });
    }

    // 2. TẠO CHUỖI SQL GỌI STRORED PROCEDURE

    let sql = `
            -- Khai báo kiểu bảng và biến OUTPUT
            DECLARE @ChiTietNhap AS ChiTietNhapType;
            DECLARE @MaNhapMoi INT;
        `;

    // Điền dữ liệu chi tiết vào bảng tạm
    for (const item of chiTietNhap) {
      // Đảm bảo escape các ký tự đặc biệt ('') cho chuỗi NVARCHAR (Note)
      const note = item.Note ? item.Note.replace(/'/g, "''") : '';

      sql += `
                INSERT INTO @ChiTietNhap (MaSP, SoLuong, GiaNhap, Note)
                VALUES (${item.MaSP}, ${item.SoLuong}, ${item.GiaNhap}, N'${note}');
            `;
    }

    // Đảm bảo escape GhiChu
    const ghiChu = GhiChu ? GhiChu.replace(/'/g, "''") : '';

    // Gọi Stored Procedure chính
    sql += `
            EXEC SP_ThemNhapKho 
                @MaKho = ${MaKho}, 
                @MaNCC = ${MaNCC}, 
                @NgayNhap = '${NgayNhap}', 
                @GhiChu = N'${ghiChu}',
                @ChiTietNhap = @ChiTietNhap,
                @MaNhapMoi = @MaNhapMoi OUTPUT;
            
            -- Trả về MaNhapMoi
            SELECT @MaNhapMoi AS MaNhap;
        `;

    // 3. THỰC THI QUERY (Tất cả logic transaction nằm trong SP)
    const result = await db.query(sql, {
      type: db.QueryTypes.SELECT, // Để lấy MaNhap trả về
    });

    // Lấy MaNhap từ kết quả trả về
    const MaNhap = result[0]?.MaNhap;

    if (!MaNhap) {
      // Lỗi này xảy ra khi SP thất bại
      return res
        .status(500)
        .json({
          success: false,
          message:
            'Thực thi Stored Procedure thất bại hoặc không lấy được ID mới.',
        });
    }

    const newNhapKhoData = { MaNhap, MaKho, MaNCC, NgayNhap, GhiChu };

    res.status(201).json({
      success: true,
      message: 'Tạo phiếu nhập kho thành công',
      data: newNhapKhoData,
    });
  } catch (error) {
    console.error('Lỗi createNhapKho (SP):', error);

    const sqlErrorMessage = error.original?.message || error.message;

    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo phiếu nhập kho. Chi tiết: ' + sqlErrorMessage,
      error: error.message,
    });
  }
};

// ----------------------------------------------------------------------
// PUT /api/nhapkho/:id - Cập nhật phiếu nhập kho
// ----------------------------------------------------------------------
const updateNhapKho = async (req, res) => {
  // 1. ĐỊNH TUYẾN: Lấy kết nối DB (Cần MaKhuVuc/ShardKey để định tuyến)
  const db = await getDbFromRequest(req);
  if (!db) return res.status(500).json({ message: 'Lỗi cấu hình Shard' });

  // Bắt đầu transaction trên kết nối Shard cụ thể này
  const transaction = await db.transaction();

  try {
    // 2. LẤY MODELS TỪ CONNECTION
    const { NhapKho, ChiTietNhap, TonKho } = getModels(db);

    const { id } = req.params; // MaNhap
    const {
      MaKho,
      MaNCC,
      NgayNhap,
      GhiChu,
      chiTietNhap: updatedChiTiet,
    } = req.body;

    // 3. Lấy phiếu nhập cũ và Chi tiết cũ trong transaction
    const existingNhapKho = await NhapKho.findByPk(id, {
      include: [{ model: ChiTietNhap, as: 'ChiTietNhaps' }],
      transaction,
    });

    if (!existingNhapKho) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ success: false, message: 'Phiếu nhập kho không tồn tại' });
    }

    // GIỮ LOGIC KHÔNG CHO SỬA KHO và NCC
    if (existingNhapKho.MaKho !== MaKho || existingNhapKho.MaNCC !== MaNCC) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message:
          'Không được phép thay đổi Kho nhập hoặc Nhà cung cấp sau khi tạo.',
      });
    }
    const currentMaKho = existingNhapKho.MaKho;

    const oldChiTiet = existingNhapKho.ChiTietNhaps;
    const oldMaSPMap = new Map(oldChiTiet.map((item) => [item.MaSP, item]));
    const updatedMaSPSet = new Set(updatedChiTiet.map((item) => item.MaSP));

    // 4. XỬ LÝ XÓA CHI TIẾT (Có trong cũ, không có trong mới)
    for (const oldItem of oldChiTiet) {
      if (!updatedMaSPSet.has(oldItem.MaSP)) {
        // Hoàn tác tồn kho (Giảm tồn kho tại Kho)
        const tonKho = await TonKho.findOne({
          where: { MaSP: oldItem.MaSP, MaKho: currentMaKho },
          transaction,
        });
        if (tonKho) {
          // Cần kiểm tra tồn kho > 0 nếu không sẽ bị lỗi CHECK constraint nếu có
          if (tonKho.SoLuongTon < oldItem.SoLuong) {
            await transaction.rollback();
            return res.status(400).json({
              success: false,
              message: `Không thể cập nhật. Hàng hóa ${oldItem.MaSP} đã được xuất một phần hoặc toàn bộ khỏi kho.`,
            });
          }

          await tonKho.update(
            { SoLuongTon: tonKho.SoLuongTon - oldItem.SoLuong },
            { transaction }
          );
        }
        // Xóa ChiTietNhap
        await ChiTietNhap.destroy({
          where: { MaNhap: id, MaSP: oldItem.MaSP },
          transaction,
        });
      }
    }

    // 5. XỬ LÝ SỬA và THÊM CHI TIẾT
    for (const newItem of updatedChiTiet) {
      const oldItem = oldMaSPMap.get(newItem.MaSP);
      const SoLuong = newItem.SoLuong; // Giá trị đã kiểm tra > 0 ở DB

      if (oldItem) {
        // SỬA
        const oldSoLuong = oldItem.SoLuong;
        const quantityDiff = SoLuong - oldSoLuong; // (+/-)

        // 5.1. Cập nhật tồn kho (nếu số lượng thay đổi)
        if (quantityDiff !== 0) {
          const tonKho = await TonKho.findOne({
            where: { MaSP: newItem.MaSP, MaKho: currentMaKho },
            transaction,
          });
          if (tonKho) {
            // Kiểm tra tồn kho âm trước khi cập nhật
            if (tonKho.SoLuongTon + quantityDiff < 0) {
              await transaction.rollback();
              return res.status(400).json({
                success: false,
                message: `Không thể cập nhật. Số lượng tồn kho sản phẩm ${newItem.MaSP} không đủ.`,
              });
            }

            await tonKho.update(
              { SoLuongTon: tonKho.SoLuongTon + quantityDiff },
              { transaction }
            );
          }
        }

        // 5.2. Cập nhật ChiTietNhap
        await ChiTietNhap.update(
          { SoLuong: SoLuong, GiaNhap: newItem.GiaNhap, Note: newItem.Note },
          { where: { MaNhap: id, MaSP: newItem.MaSP }, transaction }
        );
      } else {
        // THÊM MỚI
        // 5.3. Cập nhật tồn kho (Tăng tồn kho)
        const [tonKho] = await TonKho.findOrCreate({
          where: { MaSP: newItem.MaSP, MaKho: currentMaKho },
          defaults: { SoLuongTon: 0 },
          transaction,
        });
        await tonKho.update(
          { SoLuongTon: tonKho.SoLuongTon + SoLuong },
          { transaction }
        );

        // 5.4. Tạo ChiTietNhap mới
        await ChiTietNhap.create(
          {
            MaNhap: id,
            MaSP: newItem.MaSP,
            SoLuong: SoLuong,
            GiaNhap: newItem.GiaNhap,
            Note: newItem.Note,
          },
          { transaction }
        );
      }
    }

    // 6. CẬP NHẬT PHIẾU NHẬP MASTER (NgayNhap, GhiChu)
    await existingNhapKho.update(
      { NgayNhap: NgayNhap, GhiChu: GhiChu },
      { transaction }
    );

    // 7. COMMIT TRANSACTION
    await transaction.commit();

    res.json({ success: true, message: 'Cập nhật phiếu nhập kho thành công' });
  } catch (error) {
    await transaction.rollback();
    console.error('Lỗi updateNhapKho:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật phiếu nhập kho',
      error: error.message,
    });
  }
};

// ----------------------------------------------------------------------
// DELETE /api/nhapkho/:id - Xóa phiếu nhập kho
// ----------------------------------------------------------------------
const deleteNhapKho = async (req, res) => {
  // 1. ĐỊNH TUYẾN: Lấy kết nối DB (Cần MaKhuVuc/ShardKey để định tuyến)
  const db = await getDbFromRequest(req);
  if (!db) return res.status(500).json({ message: 'Lỗi cấu hình Shard' });

  // Bắt đầu transaction trên kết nối Shard cụ thể này
  const transaction = await db.transaction();

  try {
    // 2. LẤY MODELS TỪ CONNECTION
    const { NhapKho, ChiTietNhap, TonKho } = getModels(db);

    const { id } = req.params;

    // 3. Lấy phiếu nhập và chi tiết
    const nhapKho = await NhapKho.findByPk(id, {
      include: [
        {
          model: ChiTietNhap,
          as: 'ChiTietNhaps',
        },
      ],
      transaction, // Đọc trong transaction
    });

    if (!nhapKho) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu nhập kho',
      });
    }
    const currentMaKho = nhapKho.MaKho;

    // 4. Hoàn tác tồn kho (Giảm tồn kho)
    for (const chiTiet of nhapKho.ChiTietNhaps) {
      const tonKho = await TonKho.findOne({
        where: { MaSP: chiTiet.MaSP, MaKho: currentMaKho },
        transaction,
      });

      if (tonKho) {
        // Kiểm tra đảm bảo không xóa âm
        if (tonKho.SoLuongTon < chiTiet.SoLuong) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: `Không thể xóa phiếu nhập. Hàng hóa ${chiTiet.MaSP} đã được xuất một phần hoặc toàn bộ khỏi kho.`,
          });
        }

        await tonKho.update(
          {
            SoLuongTon: tonKho.SoLuongTon - chiTiet.SoLuong,
          },
          { transaction }
        );
      }
    }

    // 5. Xóa chi tiết nhập (Sử dụng cascade delete nếu có)
    await ChiTietNhap.destroy({
      where: { MaNhap: id },
      transaction,
    });

    // 6. Xóa bản ghi nhập
    await nhapKho.destroy({ transaction });

    // 7. COMMIT TRANSACTION
    await transaction.commit();

    res.json({
      success: true,
      message: 'Xóa phiếu nhập kho thành công',
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Lỗi deleteNhapKho:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa phiếu nhập kho',
      error: error.message,
    });
  }
};

// ----------------------------------------------------------------------
// EXPORT MODULE
// ----------------------------------------------------------------------
module.exports = {
  getAllNhapKho,
  getNhapKhoById,
  createNhapKho,
  updateNhapKho,
  deleteNhapKho,
};
