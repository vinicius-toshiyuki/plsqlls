SELECT 1 AS number_column, TO_CHAR(30 + SYSDATE, 'dd') AS "Date column", pkg_mock.mock_alias() AS another_column
FROM   table_t t
JOIN   TABLE(array(1, 3, 5)) arr ON t.a < arr.count AND table_t.x IS NOT NULL