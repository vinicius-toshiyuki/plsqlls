FUNCTION a(
    p_ab    VARCHAR2,
    p_abc   VARCHAR2,
    p_ad    NUMBER  ,
    p_adddd VARCHAR2,
    p_a     CHAR    ,
    p_a     VARCHAR2,
    p_a     VARCHAR2,
    p_a     VARCHAR2,
    p_a     VARCHAR2,
    p_a     VARCHAR2,
    p_a     VARCHAR2,
    p_b     BOOLEAN
)
RETURN NUMBER
IS
    a    NUMBER;
    ab   NUMBER;
    abc  NUMBER;
    abcd NUMBER;
BEGIN
    1 + 2;
    IF 1 = 3 AND 4 = 5 THEN
        NULL;
    END IF;

    SELECT 1 AS b,
           SYSDATE,
           TO_CHAR(
               TO_CHAR(
                   3 + 1
               )
           ) AS d,
           asd,
           fas,
           df AS asdf,
           asdfasd,
           asdf,
           asdfasdf,
           asdfasdf,
           asdfasdf,
           asdfasdf,
           asdfasdf
    INTO   b, c, d.y
    FROM   c
    JOIN   d ON c.a = d
    JOIN   e ON c.e.e.y = y
    WHERE  1 = 2;

    FOR c IN (
        SELECT 1 AS a
        FROM   DUAL
    ) LOOP
        htp.p(p.a);
    END LOOP;
END;
