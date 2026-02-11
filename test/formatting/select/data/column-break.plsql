select
to_char( sysdate , 'dd/mm/yyyy' ), to_number('01/01/01'), sysdate - ( sysdate + 10 ) , PKG_MOCK.MOCK_FUNC( A => 3 , B=> nvl(:bind_var, null))

    FROM 
    DUAL
