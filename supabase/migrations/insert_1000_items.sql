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
    food_names TEXT[] := ARRAY['제주 귤', '으뜸 한우', '유기농 수박', '단 포도', '고당도 복숭아', '수제 과자 꾸러미', '찬물로 낸 차', '유기농 조각 빵', '고기 꾸러미', '신선 달걀 30알'];
    item_names TEXT[] := ARRAY['누비판', '전자판', '전자판', '기계식 자판', '소리 가리개', '옛날 사진기', '들살이용 화로', '나무 탁자', '작은 비춤판', '달리는 발판'];
    categories TEXT[] := ARRAY['먹을거리', '전기기구', '옷가지', '놀거리', '생활도구'];
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
