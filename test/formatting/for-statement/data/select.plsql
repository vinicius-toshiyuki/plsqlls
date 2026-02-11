begin for C in(select  sysdate as DATE from  dual ) loop HTP.P(C.DATE); end loop;end;
