select
    1 as NUMBER_COLUMN,
to_char (30 + sysdate, 'dd' ) as  "Date column",
     PKG_MOCK.MOCK_ALIAS() as  ANOTHER_COLUMN
 from  TABLE_T T join table(ARRAY(1, 3, 5 )) ARR 
  on T.A < ARR.COUNT and TABLE_T.X is not null