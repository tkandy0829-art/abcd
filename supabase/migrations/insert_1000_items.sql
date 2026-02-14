-- 1000개 상품 대량 인서트 쿼리 (PL/pgSQL 블록 사용)
-- 음식 100개 (재고 100), 일반 물품 900개 (재고 900)

DO $$
DECLARE
    i INTEGER;
    v_name TEXT;
    v_category TEXT;
    v_price INTEGER;
    v_is_food BOOLEAN;
    v_stock INTEGER;
    v_img TEXT;
    -- 상품명 풀
    food_names TEXT[] := ARRAY['제주 감귤', '프리미엄 한우', '유기농 수박', '샤인머스캣', '고당도 복숭아', '수제 쿠키 세트', '더치 커피 원액', '유기농 조각 케이크', '정육 세트', '신선 계란 30구'];
    item_names TEXT[] := ARRAY['맥북 에어 M2', '아이폰 14', '갤럭시 S23', '기계식 키보드', '노이즈 캔슬링 헤드폰', '빈티지 필름 카메라', '캠핑용 화로대', '우드 감성 테이블', '미니 빔 프로젝터', '전동 킥보드'];
    categories TEXT[] := ARRAY['식품', '전자기기', '의류/잡화', '취미/가구', '생활용품'];
BEGIN
    -- 1. 음식 100개 인서트
    FOR i IN 1..100 LOOP
        v_name := food_names[floor(random() * array_length(food_names, 1)) + 1] || ' ' || i;
        v_category := '식품';
        v_price := (floor(random() * 50) + 1) * 1000; -- 1,000 ~ 50,000원
        v_is_food := true;
        v_stock := 100;
        v_img := 'https://picsum.photos/seed/food' || i || '/200/200';
        
        INSERT INTO public.items (id, name, category, base_price, is_food, image_url, stock)
        VALUES (uuid_generate_v4(), v_name, v_category, v_price, v_is_food, v_img, v_stock);
    END LOOP;

    -- 2. 일반 물품 900개 인서트
    FOR i IN 1..900 LOOP
        v_name := item_names[floor(random() * array_length(item_names, 1)) + 1] || ' ' || i;
        v_category := categories[floor(random() * (array_length(categories, 1) - 1)) + 2]; -- '식품' 제외한 카테고리
        v_price := (floor(random() * 200) + 10) * 1000; -- 10,000 ~ 200,000원
        v_is_food := false;
        v_stock := 900;
        v_img := 'https://picsum.photos/seed/item' || i || '/200/200';
        
        INSERT INTO public.items (id, name, category, base_price, is_food, image_url, stock)
        VALUES (uuid_generate_v4(), v_name, v_category, v_price, v_is_food, v_img, v_stock);
    END LOOP;
END $$;
