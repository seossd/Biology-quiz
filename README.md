# 생명 영어단어 퀴즈 앱

영어 단어가 나오면 한글 뜻을 주관식으로 입력하는 React + Vite 앱입니다. GitHub에 올린 뒤 Vercel에서 바로 배포할 수 있습니다.

## 기능

- 학습용 모드: 정답 보기, 외움/헷갈림 체크, 별표 단어, 단어장 검색
- 시험용 모드: 랜덤 주관식 시험, 문항 수 선택, 자동 채점, 결과 화면
- 오답 체크: 틀린 단어 자동 저장, 오답만 다시 풀기
- 로컬 저장: 오답/별표/최근 점수는 브라우저 localStorage에 저장

## 로컬 실행

```bash
npm install
npm run dev
```

## Vercel 배포

1. 이 폴더 전체를 GitHub 저장소에 업로드합니다.
2. Vercel에서 `Add New Project` → 해당 GitHub 저장소를 선택합니다.
3. Framework Preset은 `Vite`로 두면 됩니다.
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Deploy를 누릅니다.
