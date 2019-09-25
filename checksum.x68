START ORG $1000
    lea     SaveData_GameDefault(pc),a6
    moveq   #$28,d6
    bsr.s   Create_SRAMChecksum
    rts

; Begin subroutine
Create_SRAMChecksum:
    moveq   #0,d7

loc_C364:
    move.w  (a6)+,d5
    eor.w   d5,d7
    lsr.w   #1,d7
    bcc.s   loc_C370
    eori.w  #$8810,d7

loc_C370:
    dbf     d6,loc_C364
    rts
; End subroutine

    SIMHALT

; Default save data
SaveData_GameDefault:
    dc.w  $8000,     0,     0,     0,  $300, $8000,     0,     0,     0,  $300, $8000,     0,     0,     0,  $300, $8000
    dc.w      0,     0,     0,  $300, $8000,     0,     0,     0,  $300, $8000,     0,     0,     0,  $300, $8000,     0
    dc.w      0,     0,  $300, $8000,     0,     0,     0,  $300, $4244

    END    START
