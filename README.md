# Limited Goods Frontend

React + Vite 기반의 한정 상품 주문 프론트엔드입니다.

## 실행

```bash
npm install
npm run dev
```

PowerShell 실행 정책으로 `npm`이 막히는 환경에서는 아래처럼 실행할 수 있습니다.

```powershell
npm.cmd install
npm.cmd run dev
```

## 백엔드 연결

기본 API 주소는 `http://localhost:8080`입니다. 필요하면 `.env.local`에 설정하세요.

```env
VITE_API_BASE_URL=http://localhost:8080
```

## 폴더 구조

```text
src/
  api/          서버 요청 함수
  components/   여러 화면에서 재사용하는 공통 UI
  data/         백엔드 API가 없을 때 보여줄 데모 데이터
  features/     auth, shop, orders, admin처럼 기능별 화면
  styles/       base, layout, components, views, responsive로 나눈 CSS
  utils/        포맷터, 데이터 변환 같은 작은 도우미 함수
```

작은 프로젝트는 CSS나 컴포넌트를 한 파일에 둘 수도 있지만, 화면이 늘어나면 지금처럼 역할별로 나누는 편이 유지보수하기 쉽습니다.
