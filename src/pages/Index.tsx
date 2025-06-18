
import ExcelProcessor from '@/components/ExcelProcessor';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Excel Data Processor
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your source Excel file and mapping file to transform data values according to your mapping rules
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-xl p-6">
          <ExcelProcessor />
        </div>
        
        <div className="mt-8 text-center">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Hướng dẫn sử dụng</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div>
                <h3 className="font-semibold text-lg mb-2">1. Upload Files</h3>
                <p className="text-gray-600">
                  Tải lên file dữ liệu gốc và file mapping. File mapping phải có các sheet tương ứng với cột trong file gốc.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">2. Process Data</h3>
                <p className="text-gray-600">
                  Nhấn nút "Xử lý dữ liệu" để thực hiện mapping các giá trị từ value sang key theo file mapping.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">3. Download Result</h3>
                <p className="text-gray-600">
                  Xem trước kết quả trong table và tải về file Excel đã được xử lý.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
