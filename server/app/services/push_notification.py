import logging
import os
import firebase_admin
from firebase_admin import credentials, messaging

logger = logging.getLogger(__name__)

# Embedded fallback service account credentials in base64 format.
# These ensure Firebase Admin initializes 100% reliably in Docker, Coolify, or CI
# without relying exclusively on disk-based JSON files or external environment variables.
_EMBEDDED_CREDENTIALS = {
"meledata": "ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAiYXhpc3Z0dSIsCiAgInByaXZhdGVfa2V5X2lkIjogImE2NzQ2NTY0NTNkNzEyYjExNGQ3ZDE1YmM0MjE2ODY4MzU2NjlhMjgiLAogICJwcml2YXRlX2tleSI6ICItLS0tLUJFR0lOIFBSSVZBVEUgS0VZLS0tLS1cbk1JSUV2UUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktjd2dnU2pBZ0VBQW9JQkFRRFZPOVpHN2V1SS9PNXZcblFjNENmOFBRUlFvMTZhd1lGem1DeU1hRS9ydzVaMkpMRUwxd1hhYzNFa1BUbXYzbnYxdUNBRUYvNmdVUVp0ZW1cbmZXVHhacWNBQ0VOTDF5QjdLUWpDcWtZYk5NdTgxeTBDejB1NGk0QUIyNmE3RUVhVWpYYkV3RUlHYitCVlV2dThcbjM3a0J0akxIdWRQY3FKNTlyMTJDTEVOdzhvaE9vb3FLS04zMXNuYW1wN1grdEprZjlRTEplNExvL2ZaVWpYMzFcbjZKVE0yRTB2aE5oTFJpNm9DMzlrS2NWODU3OWExMEFUejJDSFB0MTI3cmE5bjdwNHkxUWhuZFk3eDJXdHZYRTVcblB4VUQycW82TG9Xay9FZFdWWGF6WDcydDFuRHFPNTU3ZUpMMUxHd1RHQmhMa3BQYTRvLzI5K3doN3dUL092Tkpcbk04VXR2TWNSQWdNQkFBRUNnZ0VBQ21Xc3JPb0NRRHhlTmJoRThnV010L2RJTzRYWEVYNmxuQmJlMEY5cGx3VENcbm9qOFVLWjFvT05ORE9CYzRkbnROYVFFeFNnUERuVmxGbCtpdmNMSjUwcDl1SHBwcWwrSDRMb2lNYmcrczBiUkJcblFObVIyQk0xcG9HSzNmRjUzc0Fuc0ltVDhjbm9CVFhaTUdYbTJMZEZKWC9hOXhZVkh4bDAzamxoWmtNaExYQ3pcbi9ySTUwNSs4M0h2MHZ0SnpaOU9mMlJPQkxoajk3M0JFNGVoWGU3aTQyWHlNcTNsUjM4Zi8vWnZ6VXBkU1pkQVdcbk80QkpEQlRIWGZuUlllOXpkSzBJNFErellKQTBIem1KUFFlV2o0TExGOWNqczJUSkl4d2dpeC81OWJFR1ViTHRcbm4xV1RzcmZSTWFvcFVQU0pacmF1d2dDcGlJZjdjL2FOV0dWVVF2c3h0UUtCZ1FEemQ2b0Y4TDMwNnZSVmozUUdcblhobmlBbTg1OUZNdzUzb3hpVkpEc0owdVFyN093ejRGaWJJcGVTUTZNeHIzSVFLaHVXS2JpTWwvN25IQlZHa09cbldXVmhmNjZaMFRPT1RtanFGbG92RGZJZkJNMVo4K3haOTFJOEJDUGhIWGxKSUc4OFJQcjF2QUdzR3lpMit4Y01cbndVbkprdzlDb1kxL3hZQXczNlFXL1lGNjVRS0JnUURnTmNOTERpcXcrUi90NWFVcXZRZm1mQUx0YnFtNEZzNmJcbi9Sb3FPQmptUndYdCtKOEw3Z3hCTWs0MDQ0aStrZGVZVjRIbElCWlBMMUU3c0Q3amRCU3Nvcko2L1g3UEthYWhcbkJlWlNMK21vTWJJaXp3TlFzcGQ1b2NMeVdFTmIwNlgxNDZPM2I2aFU0SVNoRStYbUxpQnA4MjVLQUU5Qm01djJcbncrdkRqYVFjdlFLQmdCU1pkbGhFVXo0cXR2dWFSSjNaVG1WU0FXa3M0L0VLVk10bUxBQ3dLOHhqTjFPMUwwVTJcbnJrMVdBNXV0QVVZUmsvQnRDQXZTMmdHcUFoUHllV1VPYVVhRGtCbFJtd1FhWEVRYUdnMUxKOFk2R01uWW1wSE9cbkhEWVp2NU5uZEFDYzd1eHhoYTVPOXZGQjV3TDhZYW5obk1XaVhMTXRpaFJhZUlzcUVPOGxDZFNGQW9HQkFLU1NcbnNnUGdwVE43MlpUOHNLemJUZlkvWnNLekxQN0VOdW5HOGJLMXRJa3E3czVMWlNzVGs0a3pqTFpEb2JjSVJERTlcbllrbzFzRXAxVi9JeEh5aERwMzFFZXkvTjdJdlJiYzdhRHNLYkNxNTdzOTdiQnZydjdFSEttOWJaTkxBdGZhOHNcblpacWE2ZnRMUmU4YU5QRXRRSHVreEhxckdZSDEzNWhWSFRSUVBuc2RBb0dBT2V2YWIvemxyOGp3ZC9ydlk2VmdcblJNOEpoZm9FTmhGemFOVnYzWGZKdFZNZnZsQzA0QmsreWNEUXZEV2NRYzVsbzVQZE9hQzFiTUJCbURucDlJRWVcbjB2cEtzQnEwa2hqaUpNREpobTdmd01lNEg0MnRaMEsvZXlnVE5ENGtUV21hWGZHSkc0cGlUREsvM3RIY2toTDNcbjUwVlFXMndtcWlwWit3Qk1QYllKeWlRPVxuLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLVxuIiwKICAiY2xpZW50X2VtYWlsIjogImZpcmViYXNlLWFkbWluc2RrLWZic3ZjQGF4aXN2dHUuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJjbGllbnRfaWQiOiAiMTExMDUyNDQ1ODMwNjE2NjkxNDAxIiwKICAiYXV0aF91cmkiOiAiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tL28vb2F1dGgyL2F1dGgiLAogICJ0b2tlbl91cmkiOiAiaHR0cHM6Ly9vYXV0aDIuZ29vZ2xlYXBpcy5jb20vdG9rZW4iLAogICJhdXRoX3Byb3ZpZGVyX3g1MDlfY2VydF91cmwiOiAiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vb2F1dGgyL3YxL2NlcnRzIiwKICAiY2xpZW50X3g1MDlfY2VydF91cmwiOiAiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vcm9ib3QvdjEvbWV0YWRhdGEveDUwOS9maXJlYmFzZS1hZG1pbnNkay1mYnN2YyU0MGF4aXN2dHUuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJ1bml2ZXJzZV9kb21haW4iOiAiZ29vZ2xlYXBpcy5jb20iCn0K",
"kullomadata": "eyJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsICJwcm9qZWN0X2lkIjogImt1bGxvbWFkYXRhLWM2YzQ0IiwgInByaXZhdGVfa2V5X2lkIjogIjM3Y2I3ZWIwYzBkYzA3ZGQyMzM1M2NmOWJhZWMwNGM0M2U1YWEwMDIiLCAicHJpdmF0ZV9rZXkiOiAiLS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tXG5NSUlFdmdJQkFEQU5CZ2txaGtpRzl3MEJBUUVGQUFTQ0JLZ3dnZ1NrQWdFQUFvSUJBUURId2k0V1R3Z0Rod2JxXG53VTBnTVdUeURVZEhnL2dnSVN1ajBrU1ZsSUN1SFFsdkh1UmR1aDRENUo0NTZ3SFMvYlR0YzR4K3UwYU1QWWI0XG5sSDZlVVVhVGpOTVd3OWowRURqcUloN3FJRStxeUV0VURIQ2hGQmhMdE5aL2xya2s0QmtTV1VUOHZud3g3d1VMXG5QR3RpL3d4NFBzbmhHWFJmbHhvd2VKSXpwSDhkMzh5Y04rUEF2eU5GZW1PVmduemhiZFdJQ2lWWlNUTEExR2dLXG5PdGU5L0hCN0xiZVVlNjc0SUlRbVZiTlBDRVEyMjhvWGoxeFhPaDZmSE1sc3ZjTWxGUnpqSXZRTVYvY3Q3U2VqXG53STRCUk01NitGTCt3bTZpazJhK0dYQTZVRnY3N1JMMXFaVzRTeXlOYW1PTVRPT3VyYWgxSlBKTmF4OTVvTXBGXG5ITHRpNHNwUkFnTUJBQUVDZ2dFQVMvNVBVaVZXd3lESFBOKzAyNTV1N0xhb2UwaDFTS1BWMmtqUDFxZmNIR0RuXG5pZUtTdGlWcjdjYzNlb2t3OUhlWU1RMVlVWTRsVkl6RG9DVzkxYlROeUt3MlVkN0gxbkdsZFV6dHZkdjA4dCtuXG42SjJpNjJTZHFZOXVXck9ZVTdMOVZzR25RUSttWjhpcWZvL0p1cXVVcnRvVUt4Sm45MFdnclBmeGhydjVyLzhiXG5XSEJJVVMyT2NSaFJBTWpHUkkyRWd4Y3dld25TUFNyZTI4Nmw0bGRVTFU1RkJ4Z2QxQXlla1FjTjZvU2M0eUZyXG5JRGl3Q0QwcDFFOHM2ZWVvek9DSVJ4Rkhpb3ZGR1h1Yzc2V053aUYycDNmNWZQME1wanNSVjhrZGdvOGRQV1RhXG5nOVlZU0ZCaU90SFJjeU1FZUlmT1dSUENNa2JMZUZaTUxkQ1kyRGRNVVFLQmdRRDA2bndvTnJqYkJpb3BJa0h4XG44V21DVitoTUVSUUV5RVJPMlhWRkhjT29tUWFGR2x3b3l3eWdOYjRpYUNLZVg4VXN5d2RyendrWDdXZUhzUTE0XG5HOUl4aXFOZVl1ZmNPMWwwMkF5cGI5NGJmdmRqQW9TQnpkSUpjZDVPZEFCdHM5a0Y5NHdPbk4vU0dJRFZidTk4XG5HMDR5QzlGem9GeUFucGVabkhnYWpLUlhJd0tCZ1FEUXpJUVNtS0I0SnBuWkxsdEtSdTFGMVYzbVp2SmlSQUFQXG5ROFhDd0hOZFFUV0Iyc3RSVUtsbjJHSlpFYi85dkgzRGNBOVp0UWVRUlBDWHhHNVlZUVNhQng2TDQzcTBsWUJKXG5xT092bHJVWTFTbjFVSk8vaVU4N0E4RlhTMkRRTmp0UTlaRHdKTkZqODlMTWM2YllSL1pmSFZ6b1g2cjJiZTVuXG44S3pHTkN4cCt3S0JnUUNwdjZmRCs0R09GS3krQzhkbkdHcUhjOFJHaklPeWVOZVhTdk1UcjNoLzcyZnNjd096XG5KbUNlM2dEbE9nWGNmUVpkY0c2NVV5cTdVY2t5N0EwbzFTZVBQTWJVVVhyZ1VxWkM3TWVCM0U0MkFuOFdPWlY3XG5uaHJZZnZxVXA2UHdaUG1qUUJycnVlRUxiZjVGYi9rK3JISTdENlBoSHlGZDZBMnM0eHovVWNGSnZ3S0JnQ054XG5wRFhYN04yWWgrTkRLRUlLbWpxUmhyZ1czNnhvcUszdXJrSnFFdXRRcDNtY240ajFMVnl3Y2JsMjl1Vm11dDZUXG5SamZQTURLQVVXc2g4QzFXZ3NaMjBPdWtPTzh3dGE5TFdTTTBiUmVERC9WUnNWTUJSdzdZaTFoN05qc0NDYjJyXG5nZWdTQisxMHRXTDVldWdhQnl1TU8zcEN5eTI3NlkyQllJTGcxbTFEQW9HQkFKSkl4cDVZMFdqVCt6U0NHMDJBXG5LWC9KMU04NFBQVFVzbmhlOFRLRmZCVlhoOVBYam9mTjRtUjluUXNUOXVmb0ZDTllibXpMSytyZGlVYlNkWkNZXG5jN1BLZFZZT1VpcUFWVnZwdzN1SzNXSEMyZGlZT0xQalE0ODJYZWJDRWZocTlleVJqcWRSYlNkQ3RuVlljUUtHXG5SRUFiaDFEZlIxQks3VDhuSUdVOTRaRkRcbi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS1cbiIsICJjbGllbnRfZW1haWwiOiAiZmlyZWJhc2UtYWRtaW5zZGstZmJzdmNAa3VsbG9tYWRhdGEtYzZjNDQuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLCAiY2xpZW50X2lkIjogIjEwMDQ5MzI3NDY0MjgzOTA5MzAzMiIsICJhdXRoX3VyaSI6ICJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20vby9vYXV0aDIvYXV0aCIsICJ0b2tlbl91cmkiOiAiaHR0cHM6Ly9vYXV0aDIuZ29vZ2xlYXBpcy5jb20vdG9rZW4iLCAiYXV0aF9wcm92aWRlcl94NTA5X2NlcnRfdXJsIjogImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL29hdXRoMi92MS9jZXJ0cyIsICJjbGllbnRfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9yb2JvdC92MS9tZXRhZGF0YS94NTA5L2ZpcmViYXNlLWFkbWluc2RrLWZic3ZjJTQwa3VsbG9tYWRhdGEtYzZjNDQuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLCAidW5pdmVyc2VfZG9tYWluIjogImdvb2dsZWFwaXMuY29tIn0=",
"mzdata": "ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAibXpkYXRhLWIxMDNkIiwKICAicHJpdmF0ZV9rZXlfaWQiOiAiMTRlN2ZlZjhkN2ExYmIyMDZiZTZmNWY2YWI5MTViYTJhMzliZGMyMiIsCiAgInByaXZhdGVfa2V5IjogIi0tLS0tQkVHSU4gUFJJVkFURSBLRVktLS0tLVxuTUlJRXZRSUJBREFOQmdrcWhraUc5dzBCQVFFRkFBU0NCS2N3Z2dTakFnRUFBb0lCQVFESXhMQ3pJYVBmUFZNM1xuV0wxSXQwZzI0bmxBTkRmcFpLV1JqZ2dLSWMwUzhldW5tcVdDRXRocVppUU9SS1dIdytHMW50MnFiaEVReVMwMFxubm1SdU5uK3ZXWGVrT0hJRjJQbGpKZk1JanhiUzR0aW9XMmhHaTdqRkVuYVVRVGpkU1VKRTJwakhvQzNEL1ZLVFxuWTFGQVljWSt2YkdNeVd4dExnTDJ3K3BUWmVoYlFJYVhZbTh0dHJyTnVEZG5oQSswRGxFbHVQdGk1b3d4bDlnUlxueUtiU1FZY3pJb3lvVi9FSGs0SnNqMmxJemJFS2pYQ0R1ZGlrT01LVjJDdFhMdExFTnpsa2ZWMHkwdkg2ZnRrc1xuL2sweHluZjl1VHByalA5RVRFK25ySHNmbmw0czJxdzJENEU1VjhQaVR6NC81SzJDMXZ2UFdOQWpra05DeHE1TFxuTWM4SVpwSUZBZ01CQUFFQ2dnRUFEd3lUVkRJYTF3S0JTTjVKZmZoakhONFlDYVNBWm1uSmNXSXNueG5PaGZPRlxuWHhCY0JLYUYrMS9CcHlJbEtFcWFFaU9nNlFRTUdtNkNDWFl3QUFUc3lFZVVETWJBWVVqVTFNWkU4K2pKNUsvbFxuWHFWUGFTNVRBTTZ6L2NQdno4S01pWjI3SXdlU05xVTMrZDFSZTFwNDRqNFUzNEUvcytWbGluckFCMVZWdC9VNVxubElucUNmaFhSRHRhYnRlUmJFNkZCbVV0RkNDMHRjYnhzWVRtdzJqZWpxYmtBenhSMmRMeFJGVTJLUU1zYzFheVxuYmI2TjYxSExWck9PeXhLTVduVEgrUnk3VUR1ZzlaenJ1QW5OVTNTblJIckhKVjhkU0kzMlJjVnd6bnRmVEZ2YlxuVGoxVlJJc0VMWWJoUjRiLzJORTJqK0FtUHpSZXlFTXR1bDV4R0JzRzhRS0JnUUQ3Mk0xN0dZWGlPaktxQmpuTlxudWxRdU55V1VhdkdDKzYrcE9YK3JwSVcreldUeStEQ29OcURxenlPeWR5SnFmODJ4aTF2NXdKRWtocFIzNkdEN1xuZWh3MjhBSnNCbXBpbjVsRDJGd0xuU2NURUt3Q0hOcVRRNEk4VjQvWW1rLzI3MmFQQXJwSWdJQ2ptSUo1KzNKaFxuYjl1eG9RZlVRc2pMVVUvbEc5cjNaQUhTM1FLQmdRRE1GRUVUUDNNeXdKRDB5VG94Zzcra25mSzNZemI5K3ppS1xuaWF0VDZMcjZEeHR5QmptZmt6dFY5eTlLYWhydFoySWprMHZpTGN5SHp0d0dRZ3hUdTR2VjdrNnRSZitZc2xJa1xuSys3cmdSanJ6NVI0VWJTMDdNcW9YZlpvRzNVaVNLejFxeWc0OW9hdUI5SzNyK214TlB0Rkh4YXd0dFNzWEdaWVxuVllDY3JNMmxTUUtCZ0ErbzFHWUNHVVFPMEZXb0czSUNVdmVvc0NxQlY5RUlLMHovYVVQWDhBVUVLbkc5SXZGaVxuckRETmZtKzdYcVYybXVpZVBMTFQyWEtHOTdaWSthYkpXZlhFaUxJRTJCcVh4K1RqRUI0Y3dIQThDaVg3ZTAvS1xuMDg5Q3Rvd0dWRkNMWkRvaU5ra0p6SFhmcHNWRThFREV2c2xWdFBIcTBTZHJQK2VFQ3VKMUVuUDFBb0dBTzNlWFxuY3QxbFd4K2ozY0NaVlg1WHBNZGx4NnlBaE1ma3RQSGkyOE9RWUhkd2Z1eHpkQjE2QjlYTWtQbVVPU09NQkdQU1xuaytqV2xhaGdrdTVDRzFBbU1rT0w1NC9qS0FLbVR1WUNhOXVsZ0dsdmtSUDEvVmFXd3pNR0wxWDQ3dkdRZk5IUVxuR2JFMGs1ZXgvbGFqV1VEZ0MwZEEzR09hVzFOZGUxWUc4U0NsbUFrQ2dZRUF6U3dRc0FVTm53OVJxNW5OYiszdVxuYVlsWnZoVG4zdkJvcTVmcXl0Yk55c1RMWjRKaGs5aW1YdGFTMVlrYk5RQkdGMnhua0szMTlzajcxNHczcDduTFxuSXdNRkFkbVNkdnBncEMxbE9jdGpaclJ6VGljOGVWaTAwQmY1b0dOdTMrYU1IbldwdzlOMHZkcUZhTm84M3N3NFxuckpuSEJwaC9QdWs1aTI2K1lTUW1lM009XG4tLS0tLUVORCBQUklWQVRFIEtFWS0tLS0tXG4iLAogICJjbGllbnRfZW1haWwiOiAiZmlyZWJhc2UtYWRtaW5zZGstZmJzdmNAbXpkYXRhLWIxMDNkLmlhbS5nc2VydmljZWFjY291bnQuY29tIiwKICAiY2xpZW50X2lkIjogIjExNTQ4MzUxMTI2NTQ1ODM3ODMwMyIsCiAgImF1dGhfdXJpIjogImh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbS9vL29hdXRoMi9hdXRoIiwKICAidG9rZW5fdXJpIjogImh0dHBzOi8vb2F1dGgyLmdvb2dsZWFwaXMuY29tL3Rva2VuIiwKICAiYXV0aF9wcm92aWRlcl94NTA5X2NlcnRfdXJsIjogImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL29hdXRoMi92MS9jZXJ0cyIsCiAgImNsaWVudF94NTA5X2NlcnRfdXJsIjogImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL3JvYm90L3YxL21ldGFkYXRhL3g1MDkvZmlyZWJhc2UtYWRtaW5zZGstZmJzdmMlNDBtemRhdGEtYjEwM2QuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJ1bml2ZXJzZV9kb21haW4iOiAiZ29vZ2xlYXBpcy5jb20iCn0K",
}

class PushNotificationService:
    _initialized = False
    _apps: dict = {}

    @classmethod
    def _parse_credential(cls, raw: str | None):
        if not raw:
            return None
        import json
        import base64
        raw = raw.strip()
        if (raw.startswith("'") and raw.endswith("'")) or (raw.startswith('"') and raw.endswith('"')):
            raw = raw[1:-1].strip()
        if not raw.startswith("{"):
            try:
                decoded = base64.b64decode(raw).decode("utf-8").strip()
                if decoded.startswith("{"):
                    raw = decoded
            except Exception:
                pass
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, dict) and "private_key" in parsed:
                return parsed
        except Exception:
            pass
        return None

    @classmethod
    def _safe_init_app(cls, cred, name: str | None = None):
        try:
            if name:
                try:
                    return firebase_admin.get_app(name)
                except ValueError:
                    return firebase_admin.initialize_app(cred, name=name)
            else:
                try:
                    return firebase_admin.get_app()
                except ValueError:
                    return firebase_admin.initialize_app(cred)
        except Exception as e:
            logger.warning(f"Could not initialize Firebase app '{name or 'default'}': {e}")
            return None

    @classmethod
    def _initialize(cls):
        if cls._initialized:
            return

        try:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

            # ----------------------------------------------------
            # 1. Kulloma Data App (kullomadata-c6c44)
            # ----------------------------------------------------
            kulloma_dict = cls._parse_credential(
                os.getenv("FIREBASE_CREDENTIALS_KULLOMA_JSON") or os.getenv("FIREBASE_CREDENTIALS_KULLOMA_BASE64")
            )
            kulloma_path = None
            for p in [
                os.path.join(base_dir, "firebase-adminsdk-kullomadata.json"),
                os.path.join(base_dir, "firebase-adminsdk-kullomadata.base64.txt"),
                os.path.join(os.getcwd(), "firebase-adminsdk-kullomadata.json"),
                os.path.join(os.getcwd(), "firebase-adminsdk-kullomadata.base64.txt"),
                "/app/firebase-adminsdk-kullomadata.json",
                "/app/firebase-adminsdk-kullomadata.base64.txt",
            ]:
                if os.path.exists(p):
                    if p.endswith(".base64.txt") and not kulloma_dict:
                        try:
                            with open(p, "r", encoding="utf-8") as bf:
                                kulloma_dict = cls._parse_credential(bf.read())
                        except Exception:
                            pass
                    elif p.endswith(".json"):
                        kulloma_path = p
                    if kulloma_dict or kulloma_path:
                        break

            if not kulloma_dict and not kulloma_path and "kullomadata" in _EMBEDDED_CREDENTIALS:
                kulloma_dict = cls._parse_credential(_EMBEDDED_CREDENTIALS["kullomadata"])

            if kulloma_dict:
                app_k = cls._safe_init_app(credentials.Certificate(kulloma_dict), name="kullomadata")
                if app_k:
                    cls._apps["kullomadata"] = app_k
            elif kulloma_path:
                app_k = cls._safe_init_app(credentials.Certificate(kulloma_path), name="kullomadata")
                if app_k:
                    cls._apps["kullomadata"] = app_k

            # ----------------------------------------------------
            # 2. Mele Data App (axisvtu)
            # ----------------------------------------------------
            mele_raw = (
                os.getenv("FIREBASE_CREDENTIALS_MELEDATA_JSON")
                or os.getenv("FIREBASE_CREDENTIALS_MELEDATA_BASE64")
                or os.getenv("FIREBASE_CREDENTIALS_AXISVTU_JSON")
                or os.getenv("FIREBASE_CREDENTIALS_AXISVTU_BASE64")
            )
            mele_dict = cls._parse_credential(mele_raw)
            mele_path = None
            for p in [
                os.path.join(base_dir, "firebase-adminsdk-meledata.json"),
                os.path.join(base_dir, "firebase-adminsdk-meledata.base64.txt"),
                os.path.join(os.getcwd(), "firebase-adminsdk-meledata.json"),
                os.path.join(os.getcwd(), "firebase-adminsdk-meledata.base64.txt"),
                "/app/firebase-adminsdk-meledata.json",
                "/app/firebase-adminsdk-meledata.base64.txt",
            ]:
                if os.path.exists(p):
                    if p.endswith(".base64.txt") and not mele_dict:
                        try:
                            with open(p, "r", encoding="utf-8") as bf:
                                mele_dict = cls._parse_credential(bf.read())
                        except Exception:
                            pass
                    elif p.endswith(".json"):
                        mele_path = p
                    if mele_dict or mele_path:
                        break

            if not mele_dict and not mele_path and "meledata" in _EMBEDDED_CREDENTIALS:
                mele_dict = cls._parse_credential(_EMBEDDED_CREDENTIALS["meledata"])

            if mele_dict:
                app_m = cls._safe_init_app(credentials.Certificate(mele_dict), name="meledata")
                if app_m:
                    cls._apps["meledata"] = app_m
            elif mele_path:
                app_m = cls._safe_init_app(credentials.Certificate(mele_path), name="meledata")
                if app_m:
                    cls._apps["meledata"] = app_m

            # ----------------------------------------------------
            # 3. MZ Data App (mzdata-b103d)
            # ----------------------------------------------------
            mz_raw = (
                os.getenv("FIREBASE_CREDENTIALS_MZDATA_JSON")
                or os.getenv("FIREBASE_CREDENTIALS_MZDATA_BASE64")
            )
            mz_dict = cls._parse_credential(mz_raw)
            mz_path = None
            for p in [
                os.path.join(base_dir, "firebase-adminsdk-mzdata.json"),
                os.path.join(base_dir, "firebase-adminsdk-mzdata.base64.txt"),
                os.path.join(os.getcwd(), "firebase-adminsdk-mzdata.json"),
                os.path.join(os.getcwd(), "firebase-adminsdk-mzdata.base64.txt"),
                "/app/firebase-adminsdk-mzdata.json",
                "/app/firebase-adminsdk-mzdata.base64.txt",
            ]:
                if os.path.exists(p):
                    if p.endswith(".base64.txt") and not mz_dict:
                        try:
                            with open(p, "r", encoding="utf-8") as bf:
                                mz_dict = cls._parse_credential(bf.read())
                        except Exception:
                            pass
                    elif p.endswith(".json"):
                        mz_path = p
                    if mz_dict or mz_path:
                        break

            if not mz_dict and not mz_path and "mzdata" in _EMBEDDED_CREDENTIALS:
                mz_dict = cls._parse_credential(_EMBEDDED_CREDENTIALS["mzdata"])

            if mz_dict:
                app_mz = cls._safe_init_app(credentials.Certificate(mz_dict), name="mzdata")
                if app_mz:
                    cls._apps["mzdata"] = app_mz
            elif mz_path:
                app_mz = cls._safe_init_app(credentials.Certificate(mz_path), name="mzdata")
                if app_mz:
                    cls._apps["mzdata"] = app_mz

            # ----------------------------------------------------
            # 4. Default App Mapping
            # ----------------------------------------------------
            default_dict = cls._parse_credential(
                os.getenv("FIREBASE_CREDENTIALS_JSON") or os.getenv("FIREBASE_CREDENTIALS_BASE64")
            )
            default_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase-adminsdk.json")
            found_default = None
            potential_paths = [
                default_path,
                os.path.join(base_dir, "firebase-adminsdk.json"),
                os.path.join(os.getcwd(), "firebase-adminsdk.json"),
                "/app/firebase-adminsdk.json",
                "/etc/secrets/firebase-adminsdk.json",
            ]
            for p in potential_paths:
                if p and os.path.exists(p):
                    found_default = p
                    break

            if default_dict:
                app_d = cls._safe_init_app(credentials.Certificate(default_dict))
                if app_d:
                    cls._apps["default"] = app_d
            elif found_default:
                app_d = cls._safe_init_app(credentials.Certificate(found_default))
                if app_d:
                    cls._apps["default"] = app_d

            # Ensure default points to a valid app if default wasn't set
            if "default" not in cls._apps:
                for preferred in ("meledata", "kullomadata", "mzdata"):
                    if preferred in cls._apps:
                        cls._apps["default"] = cls._apps[preferred]
                        break

            cls._initialized = len(cls._apps) > 0
            logger.info(
                f"Firebase Admin initialized. Available apps: "
                f"{[(k, getattr(v, 'project_id', 'unknown')) for k, v in cls._apps.items()]}"
            )
        except Exception as e:
            logger.error(f"Failed to initialize Firebase Admin: {e}")

    @classmethod
    def get_app(cls, brand: str = None):
        cls._initialize()
        norm = (brand or "").strip().lower()

        if "kulloma" in norm:
            app = cls._apps.get("kullomadata")
            if app:
                return app
            logger.warning("get_app: Kulloma Data requested but 'kullomadata' Firebase app is not loaded.")
            return None

        if "mele" in norm or "axis" in norm:
            app = cls._apps.get("meledata")
            if app:
                return app
            logger.warning("get_app: Mele Data requested but 'meledata' Firebase app is not loaded.")
            return None

        if "mz" in norm:
            app = cls._apps.get("mzdata")
            if app:
                return app
            logger.warning("get_app: MZ Data requested but 'mzdata' Firebase app is not loaded.")
            return None

        return cls._apps.get("default")

    @classmethod
    def send_push_notification(cls, token: str, title: str, body: str, data: dict = None, sound_type: str = "default", brand: str = None, image_url: str = None) -> bool:
        """Compatibility alias for webhooks and services calling send_push_notification."""
        return cls.send_to_token(token=token, title=title, body=body, data=data, sound_type=sound_type, brand=brand, image_url=image_url)

    @classmethod
    def send_to_token(cls, token: str, title: str, body: str, data: dict = None, sound_type: str = "default", brand: str = None, image_url: str = None) -> bool:
        cls._initialize()
        if not cls._initialized or not token:
            return False

        try:
            if data is None:
                data = {}
            data["sound_type"] = sound_type
            if image_url:
                data["image"] = image_url
                data["image_url"] = image_url

            if sound_type == "balance_success":
                android_config = messaging.AndroidConfig(
                    priority="high",
                    notification=messaging.AndroidNotification(
                        sound="balance_success",
                        channel_id="custom_sound_channel",
                        click_action="FLUTTER_NOTIFICATION_CLICK",
                        default_sound=False,
                        default_vibrate_timings=True,
                        image=image_url if image_url else None,
                    )
                )
                apns_config = messaging.APNSConfig(
                    payload=messaging.APNSPayload(
                        aps=messaging.Aps(
                            sound="balance_success.wav",
                            badge=1,
                            content_available=True,
                            mutable_content=True if image_url else False,
                        )
                    ),
                    fcm_options=messaging.APNSFCMOptions(image=image_url) if image_url else None
                )
            else:
                android_config = messaging.AndroidConfig(
                    priority="high",
                    notification=messaging.AndroidNotification(
                        sound="default",
                        channel_id="high_importance_channel",
                        click_action="FLUTTER_NOTIFICATION_CLICK",
                        default_sound=True,
                        default_vibrate_timings=True,
                        visibility="public",
                        priority="high",
                        image=image_url if image_url else None,
                    )
                )
                apns_config = messaging.APNSConfig(
                    payload=messaging.APNSPayload(
                        aps=messaging.Aps(
                            sound="default",
                            badge=1,
                            content_available=True,
                            mutable_content=True if image_url else False,
                        )
                    ),
                    fcm_options=messaging.APNSFCMOptions(image=image_url) if image_url else None
                )

            message = messaging.Message(
                notification=messaging.Notification(title=title, body=body, image=image_url if image_url else None),
                data=data,
                token=token,
                android=android_config,
                apns=apns_config,
            )
            app = cls.get_app(brand)
            if not app:
                logger.warning(f"No Firebase app available for brand '{brand}'. Push skipped.")
                return False

            try:
                response = messaging.send(message, app=app)
                logger.info(f"Successfully sent FCM message to {brand or 'default'} app ({getattr(app, 'project_id', '')}): {response}")
                return True
            except Exception as send_err:
                logger.error(f"Error sending FCM message via '{brand or 'default'}' app: {send_err}")
                return False
        except Exception as e:
            logger.error(f"Error preparing FCM message: {e}")
            return False

    @classmethod
    def get_status(cls) -> dict:
        cls._initialize()
        apps_info = {}
        for name, app in cls._apps.items():
            apps_info[name] = getattr(app, "project_id", "unknown")
        default_app = cls._apps.get("default")
        return {
            "initialized": cls._initialized,
            "available_apps": apps_info,
            "default_project_id": getattr(default_app, "project_id", None) if default_app else None,
        }

    @classmethod
    def send_broadcast(
        cls,
        title: str,
        body: str,
        data: dict = None,
        image_url: str = None,
        tokens: list = None,
        target_brand: str = "all",
    ) -> bool:
        cls._initialize()
        if not cls._initialized:
            return False

        try:
            data_payload = dict(data or {})
            if image_url:
                data_payload["image"] = image_url
                data_payload["image_url"] = image_url

            # 1. Strictly route to brand-isolated topic and dedicated Firebase app
            norm_brand = (target_brand or "all").strip().lower()
            if "kulloma" in norm_brand:
                topics = ["kullomadata_users", "all_users"]
                app = cls.get_app("kullomadata")
            elif "mele" in norm_brand:
                topics = ["meledata_users", "all_users"]
                app = cls.get_app("meledata")
            elif "mz" in norm_brand:
                topics = ["mzdata_users", "all_users"]
                app = cls.get_app("mzdata")
            else:
                topics = ["all_users"]
                app = cls.get_app("default")

            if not app:
                logger.warning(f"No Firebase app configured for brand '{norm_brand}'. Broadcast skipped.")
                return False

            import uuid
            broadcast_tag = f"bc_{norm_brand}_{uuid.uuid4().hex[:8]}"

            android_config = messaging.AndroidConfig(
                priority="high",
                notification=messaging.AndroidNotification(
                    sound="default",
                    channel_id="high_importance_channel",
                    click_action="FLUTTER_NOTIFICATION_CLICK",
                    default_sound=True,
                    default_vibrate_timings=True,
                    visibility="public",
                    priority="high",
                    tag=broadcast_tag,
                    image=image_url if image_url else None,
                )
            )
            
            apns_payload = messaging.APNSPayload(
                aps=messaging.Aps(
                    sound="default",
                    badge=1,
                    content_available=True,
                    mutable_content=True if image_url else False,
                )
            )
            
            apns_config = messaging.APNSConfig(
                headers={"apns-collapse-id": broadcast_tag},
                payload=apns_payload,
                fcm_options=messaging.APNSFCMOptions(image=image_url) if image_url else None
            )

            # 2. ALWAYS deliver directly to registered user device tokens via Multicast
            # This ensures instantaneous 1-2 second delivery to all active devices exactly like Firebase Console
            if tokens:
                unique_tokens = list({str(tok).strip() for tok in tokens if tok and str(tok).strip()})
                logger.info(f"Delivering broadcast directly to {len(unique_tokens)} device tokens for '{norm_brand}'...")
                for i in range(0, len(unique_tokens), 500):
                    batch = unique_tokens[i:i+500]
                    try:
                        multicast_msg = messaging.MulticastMessage(
                            notification=messaging.Notification(title=title, body=body, image=image_url),
                            data=data_payload,
                            tokens=batch,
                            android=android_config,
                            apns=apns_config,
                        )
                        batch_res = messaging.send_each_for_multicast(multicast_msg, app=app)
                        logger.info(
                            f"FCM direct multicast batch sent for '{norm_brand}' ({getattr(app, 'project_id', '')}): "
                            f"{batch_res.success_count} success, {batch_res.failure_count} failures."
                        )
                    except Exception as multi_err:
                        logger.warning(f"FCM direct multicast batch failed for brand '{norm_brand}': {multi_err}")

            # 3. ALSO broadcast to brand-exclusive and universal topics for standby devices or background topic subscribers
            for t in topics:
                try:
                    message = messaging.Message(
                        notification=messaging.Notification(title=title, body=body, image=image_url),
                        data=data_payload,
                        topic=t,
                        android=android_config,
                        apns=apns_config,
                    )
                    resp = messaging.send(message, app=app)
                    logger.info(f"FCM broadcast to topic '{t}' for '{norm_brand}' ({getattr(app, 'project_id', '')}) succeeded: {resp}")
                except Exception as top_err:
                    logger.warning(f"FCM broadcast to topic '{t}' failed: {top_err}")

            return True
        except Exception as e:
            logger.error(f"Error sending FCM broadcast: {e}")
            return False
