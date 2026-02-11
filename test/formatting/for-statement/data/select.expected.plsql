BEGIN
    FOR c IN (
        SELECT SYSDATE AS date
        FROM   DUAL
    ) LOOP
        htp.p(c.date);
    END LOOP;
END;
