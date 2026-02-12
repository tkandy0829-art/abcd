# Supabase & Vercel 연동 가이드

이 가이드는 생성된 `schema.sql`을 수파베이스에 적용하고, 버셀(Vercel)과 연동하는 순서를 설명합니다.

---

## 1. 수파베이스(Supabase) 스키마 적용

이미 `supabase/schema.sql` 파일을 생성해 두었습니다. 아래 단계에 따라 DB를 초기화하세요.

1.  **Supabase 대시보드**에 접속하여 프로젝트를 선택합니다.
2.  왼쪽 메뉴에서 **SQL Editor**를 클릭합니다.
3.  **New Query**를 눌러 새 창을 엽니다.
4.  내 로컬PC의 `supabase/schema.sql` 파일 내용을 복사하여 붙여넣습니다.
5.  오른쪽 하단의 **Run** 버튼을 눌러 실행합니다.
    *   성공하면 `Table Editor` 탭에서 생성된 테이블들을 확인할 수 있습니다.

---

## 2. 수파베이스 API 정보 확인

연동을 위해 두 가지 정보가 필요합니다.

1.  Supabase 프로젝트 설정의 **Project Settings > API** 메뉴로 이동합니다.
2.  **Project URL** (예: `https://xyz.supabase.co`)을 복사합니다.
3.  **anon public** 키를 복사합니다.

---

## 3. 버셀(Vercel) 환경 변수 설정

버셀 프로젝트와 수파베이스를 연결하기 위해 환경 변수를 등록해야 합니다.

1.  **Vercel 대시보드**에서 해당 프로젝트를 선택합니다.
2.  **Settings > Environment Variables** 메뉴로 이동합니다.
3.  다음 두 변수를 추가합니다:
    *   `NEXT_PUBLIC_SUPABASE_URL`: (복사한 Project URL)
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (복사한 anon public 키)
4.  **Save**를 눌러 저장합니다.
5.  (선택 사항) Vercel Marketplace에서 **Supabase Integration**을 사용하면 이 과정을 자동으로 처리할 수 있습니다.

---

## 4. 이후 진행 순서

1.  **쿼리 작성**: 이제 DB 구조가 잡혔으므로, 프론트엔드에서 `supabase-js` 라이브러리를 사용해 데이터를 조회/삽입하는 쿼리를 작성하시면 됩니다.
2.  **재배포**: Vercel에 환경 변수를 설정한 후, 프로젝트를 다시 배포(Redeploy)해야 변경 사항이 적용됩니다.
