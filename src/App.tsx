import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import { supabase } from './supabaseClient';

function SimulatorPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loans, setLoans] = useState<any[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<any | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [result, setResult] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const id = localStorage.getItem('userId');
    if (!id) {
      navigate('/login');
      return;
    }
    setUserId(id);
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('user_loans')
      .select('*')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (data) setLoans(data);
      });
  }, [userId]);

  useEffect(() => {
    supabase.from('refinance_products').select('*').then(({ data }) => {
      if (data) setProducts(data);
    });
  }, []);

  useEffect(() => {
    if (!selectedLoan || !selectedProduct) return;
    const calculateMonthlyPayment = (P: number, r: number, n: number) => {
      const monthlyRate = r / 100 / 12;
      if (monthlyRate === 0) return P / n;
      return (
        P * monthlyRate * Math.pow(1 + monthlyRate, n) /
        (Math.pow(1 + monthlyRate, n) - 1)
      );
    };
    const oldMonthly = calculateMonthlyPayment(
      selectedLoan.principal,
      selectedLoan.interest_rate,
      selectedLoan.remaining_months
    );
    const oldTotal = oldMonthly * selectedLoan.remaining_months;
    const oldInterest = oldTotal - selectedLoan.principal;
    const months = selectedLoan.remaining_months + (selectedProduct.defer_months || 0);
    const newMonthly = calculateMonthlyPayment(
      selectedLoan.principal,
      selectedProduct.interest_rate,
      months
    );
    const newTotal = newMonthly * months;
    const newInterest = newTotal - selectedLoan.principal;
    setResult({
      oldMonthly,
      oldInterest,
      newMonthly,
      newInterest,
      diffMonthly: oldMonthly - newMonthly,
      diffInterest: oldInterest - newInterest,
      months,
      oldTotal,
      newTotal,
    });
  }, [selectedLoan, selectedProduct]);

  const maxInterest = result ? Math.max(result.oldInterest, result.newInterest) : 1;
  const oldBar = result ? Math.round((result.oldInterest / maxInterest) * 80) : 0;
  const newBar = result ? Math.round((result.newInterest / maxInterest) * 80) : 0;

  const handleLogout = () => {
    localStorage.removeItem('userId');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-start md:justify-center px-2 py-6 md:py-16">
      <div className="w-full max-w-2xl md:max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-4 md:p-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[#22223B] text-center md:text-left flex-1">대출 갈아타기 시뮬레이터</h1>
          <button onClick={handleLogout} className="mt-4 md:mt-0 md:ml-6 px-5 py-2 text-base text-gray-400 hover:text-[#2563EB] bg-gray-50 rounded-lg shadow-sm">로그아웃</button>
        </div>
        {/* 대출 선택 */}
        <div className="mb-10">
          <label className="block text-[#22223B] font-semibold mb-3 text-lg md:text-xl">내 대출</label>
          {loans.length === 0 && <div className="text-gray-400">대출 데이터 없음</div>}
          <ul className="flex flex-col md:flex-row md:gap-6 space-y-3 md:space-y-0">
            {loans.map((loan) => (
              <li key={loan.id} className="md:flex-1">
                <button
                  className={`w-full text-left px-5 py-4 rounded-xl border-none transition font-medium text-lg md:text-xl bg-[#F1F6FE] hover:bg-[#E3EDFC] ${
                    selectedLoan?.id === loan.id
                      ? 'ring-2 ring-[#2563EB] text-[#2563EB] bg-white'
                      : 'text-[#22223B]'
                  }`}
                  onClick={() => setSelectedLoan(loan)}
                >
                  {loan.principal.toLocaleString()}원 | {loan.remaining_months}개월 | 금리 {loan.interest_rate}% | {loan.repayment_type}
                </button>
              </li>
            ))}
          </ul>
        </div>
        {/* 상품 선택 */}
        <div className="mb-12">
          <label className="block text-[#22223B] font-semibold mb-3 text-lg md:text-xl">갈아탈 상품</label>
          <ul className="flex flex-col md:flex-row md:gap-6 space-y-3 md:space-y-0">
            {products.map((product) => (
              <li key={product.id} className="md:flex-1">
                <button
                  className={`w-full text-left px-5 py-4 rounded-xl border-none transition font-medium text-lg md:text-xl bg-[#F1F6FE] hover:bg-[#E3EDFC] ${
                    selectedProduct?.id === product.id
                      ? 'ring-2 ring-[#2563EB] text-[#2563EB] bg-white'
                      : 'text-[#22223B]'
                  }`}
                  onClick={() => setSelectedProduct(product)}
                >
                  <span className="font-bold">{product.name}</span> | 금리 {product.interest_rate}% | {product.repayment_type} | 유예 {product.defer_months}개월 | {product.lender}
                </button>
              </li>
            ))}
          </ul>
        </div>
        {/* 선택한 상품 조건 */}
        {selectedProduct && (
          <div className="mb-12 p-6 md:p-10 bg-[#F1F6FE] rounded-xl text-left max-w-lg mx-auto shadow-md">
            <div className="text-[#2563EB] font-bold text-lg md:text-xl mb-3">선택한 상품 조건</div>
            <div className="mb-1 md:mb-2">상품명: <span className="font-bold">{selectedProduct.name}</span></div>
            <div className="mb-1 md:mb-2">금리: <span className="font-bold">{selectedProduct.interest_rate}%</span></div>
            <div className="mb-1 md:mb-2 flex items-center">상환 방식:
              <span className="ml-2 font-bold">{selectedProduct.repayment_type}</span>
            </div>
            <div className="mb-1 md:mb-2">유예 기간: <span className="font-bold">{selectedProduct.defer_months}개월</span></div>
            <div className="mb-1 md:mb-2">금융사: <span className="font-bold">{selectedProduct.lender}</span></div>
          </div>
        )}
        {/* 결과 영역 */}
        {result && (
          <div className="mt-12">
            <div className="border-t pt-8 mt-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                <div className="flex items-center justify-between md:justify-start md:gap-3 flex-1">
                  <span className="text-lg md:text-xl text-[#2563EB]">📊 월 납입액:</span>
                  <span className="text-xl md:text-2xl font-bold text-green-600">{result.diffMonthly > 0 ? '-' : '+'}{Math.abs(Math.round(result.diffMonthly)).toLocaleString()}원</span>
                </div>
                <div className="flex items-center justify-between md:justify-start md:gap-3 flex-1">
                  <span className="text-lg md:text-xl text-[#2563EB]">📉 총 이자:</span>
                  <span className="text-xl md:text-2xl font-bold text-green-600">{result.diffInterest > 0 ? '-' : '+'}{Math.abs(Math.round(result.diffInterest)).toLocaleString()}원</span>
                </div>
                <div className="flex items-center justify-between md:justify-start md:gap-3 flex-1">
                  <span className="text-lg md:text-xl text-[#2563EB]">⏱️ 전체 기간:</span>
                  <span className="text-xl md:text-2xl font-bold">{result.months}개월</span>
                </div>
              </div>
            </div>
            <div className="mt-8 text-center text-lg md:text-xl font-semibold text-[#2563EB]">
              {result.diffInterest > 0
                ? `약 ${Math.floor(Math.abs(result.diffInterest) / 10000).toLocaleString()}만 원 이자 절감 예상!`
                : result.diffInterest < 0
                ? `약 ${Math.floor(Math.abs(result.diffInterest) / 10000).toLocaleString()}만 원 손해 예상!`
                : '이자 절감 없음'}
            </div>
            {/* 막대 그래프 */}
            <div className="mt-8">
              <div className="w-full h-32 bg-[#F1F6FE] rounded flex items-end justify-around">
                <div className="flex flex-col items-center">
                  <div
                    className="w-8 md:w-12 bg-[#2563EB] rounded-t"
                    style={{ height: oldBar + 'px', transition: 'height 0.5s' }}
                  ></div>
                  <span className="text-sm mt-1 text-[#2563EB]">현재</span>
                </div>
                <div className="flex flex-col items-center">
                  <div
                    className="w-8 md:w-12 bg-green-400 rounded-t"
                    style={{ height: newBar + 'px', transition: 'height 0.5s' }}
                  ></div>
                  <span className="text-sm mt-1 text-green-700">갈아타기</span>
                </div>
              </div>
            </div>
            {/* 버튼 그룹 */}
            <div className="mt-10 flex flex-col md:flex-row gap-3 md:gap-6 justify-between">
              <button className="flex-1 bg-[#2563EB] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#1D4ED8] text-lg md:text-xl transition">카카오톡 공유</button>
              <button className="flex-1 bg-gray-200 text-[#2563EB] px-6 py-3 rounded-xl font-bold hover:bg-gray-300 text-lg md:text-xl transition">PDF 저장</button>
              <button className="flex-1 bg-[#F1F6FE] text-[#2563EB] px-6 py-3 rounded-xl font-bold hover:bg-[#E3EDFC] text-lg md:text-xl transition">다른 상품도 비교해보기</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<SimulatorPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
