SELECT TO_CHAR(
           SYSDATE,
           'dd/mm/yyyy'
       ),
       TO_NUMBER(
           '01/01/01'
       ),
       SYSDATE - (SYSDATE + 10),
       pkg_mock.mock_func(
           a => 3,
           b => NVL(
               :BIND_VAR,
               NULL
           )
       )
FROM   DUAL