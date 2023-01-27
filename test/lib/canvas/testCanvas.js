var should = require('chai').should(),
  Canvas = require('../../../lib/canvas/canvas').Canvas,
  path = require('path'),
  CanvasKitCanvasAdapter = require('../../../lib/canvas/canvasKitCanvasAdapter').CanvasKitCanvasAdapter,
  HtmlCanvasAdapter = require('../../../lib/canvas/htmlCanvasAdapter').HtmlCanvasAdapter;

const isWeb = typeof window !== 'undefined';

const pushPinBase64 =
  'data:image/png;base64,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' +
  'Ii1IFbwP8JK/c10jMO8AAAAAElFTkSuQmCC';

const webPushPinBase64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAALUklEQVR4XuWbCXBV1RnHf+eB' +
  'yiabhryALI5sMVojiEu1hWKMJYgJCKlkLAOouNDWZlTGKYgYoyjbgCSURaVpBYwEy9S4hMXgSHEqRlCTaFAxElmUpURL3PDdzv/e3BpjJO+Se2Nm+s3ce' +
  'W/eO/fc7/ufbz/nGoKnXsAdwACgI/AFcAz4BHgP2AW8CVQFz8oPn2ACfmhfYMsFF4R6pKRY9O5tOHrU4uhReP99wzvvQEUFHD9uVYNVBpQAxcBW4GDAvN' +
  'nTBw3AbDD3fP45dOhgNSjPkSOG8nLYvt2waRO8+KJFJGJJO7YBzwLPAZ8GBUbQABQkJ5vrli/X6kcnwqefGrZuhaIiyM83VFdHDgAbgDXAi9HNEv2ooAF' +
  'YeeutZuKcORb5+XD11dCzZ/TM1dQYXngB1q415OdLg6ztwJPAE8B/op/px0cGDcCfwmHzYFWVxY4dUFwMvXrB9dd7Z10+46mnYNEiOHTIer8WhCVAtffZ' +
  'vrsjaACGgSneuBGSkizb4T3/PHzzDSQkwMiR3ln/8kt49FFDTg5UVdlAzAJWeZ/JuSNoAPSMLeedFxr62msRIhFH+HffhVdegZoaiIuD1FSIjfUmgubKy' +
  'jJkZYFlWXKWN9eGVk8TNQcAccAbI0eGwnl5Eb74AoyBjh2xzWLzZgeUM8+EQYNg2DBP/LN7t2HyZHj5ZesjYIye5WWG5gBA/JyrcJaWFuqTkxPh+HEIhb' +
  'RyEA7DRx/Bhg3KDaBTJzjnHIiPh4suil6UsWNDrFsXOQwkAh9He2dzASB+Xs/JMYPT0y073ssZ9u0LX38NsmsBIbWWVrz9NuzbB+3bO+NkHv37w9lnn1i' +
  's3r1D7NkTWQT8saUBcCnw6qFDcMYZUFYGJSXQpo0jXL9+jlkcOwannOKMESjyFZWV8PHHjr8QIDExjt9o1w7atoXWrUGJVvfukJbWivLyb3OA37c0AGae' +
  'f765/623LFv9BYRWfvduZ6VlChJMYEgTvv3WAUBmIqEF1JEjsGePM15gSFskuMZefjls3GiYOdPONq8A/tnSANg6e7a5/J57LA4fdgCQ0HKEElK2r9+lA' +
  'a1aORpw+ukOIAJATlLAabWlIQJE36UBorIyQ1ISHDhgLQNujVb45gqDstz3Sktppdi/d6+zclJ5XQJCguiqrnZU/quvHDAk+KmnOo5RQAiEs85ygJMG7d' +
  'tnePxxWCaxsf4CTPIifHMBMKVLF7PsyBGnGPrwQ0e9tdJ1SUAIENm2VlkC7t/vaIZImiIzKS42rF5tlA3aJgHW28Ds2lrBq/zNkgitu/lmM0YF0WefwSe' +
  'fOHYrgU5EAsRVd42TzWv1R4xQxcirQG5t4vMK8JVnyWtvCDoMdgIqi4ronJzsODCB4Kq/F6a7dnXM58ILbbMZDaz3cv+PjQ0agDRj+LvsWTYu+1YmWF/9' +
  'GxNEqz9wINx/P8yaZXeS5FfUWWoyBQ1A7lVXmds3bLBsu6+qik7960slwHr0gMsug507+TNwe5MlbwYTkJVXPPGE6TtpksWBA9itMK/qL18g4bdvh+HDb' +
  'a5/CcjufaEgNWAI8NrBg06hI4/txnkvnAuAAQNgyhTDihVWOZDg5f7GxgYJwPSEBLJLSx21V/hTXPdq/266e+65tgbNBB5oTCgv/wcJwJbp083Q7GzLzv' +
  'wUz7WajYW/usxrvAqmtWth/Hj7n4EyKy8CNjbWTwCUmJ4P9HfU1NxRXk7b+HjLLmaU/XldfTGvQik11fDss9Ym4KrGBPL6vx8AdAFuASaD6afydcgQla/' +
  'q1kTsFZf6K7PzCoBSYKXH6g1EInaaq3TXV2oqAHep9u7TJ9RjxgxITrbo2dNJeRW7ldPrUvZ3Muov57dwoSEz0/oM6AP821fpm9gTzG/b1qTn5sIkuwT5' +
  'buNDpasu2a+yN2V/0gSFwGhJ49VCv+IKw+uvW3nAxGjv9TLOA0vfm3Z9r16kKjZ36/bDxynjE/Xp49T80gKv6q9SWA2RS9VKgV8DRV4Ei3bsyQBwnzFm1' +
  'r59lt28aIjk8NTnkz+Q92+o+jsRg27sv/tuw7x51k7gwmgF8jrOKwBD1ebessUwdGjDe30uA8r8tOfntq8EQrQmoJJYfYDYWLFnLQb+4FWwaMd7BWDHLb' +
  'eEEpcujUQ1v+z/zTehc2enZ6eESFdjqy/vr8qxsNBw332WHJ+21/8W1UM9DvICwKUQetVJbaMDQLzIAWpHSFFBbSx1c+QPBIRUvT7pP4U+aVBKChQUGMa' +
  'NsweqSa7tc1/JCwBTundvvWzvXi3hidW/IQ4FnNsMlVNUs+O00xxQ6jpIASPA1AZXGBTddVeI+fMjOkChRKtJe4H1efMCQHZycmh6UVH0q98QEOoHKESq' +
  'MJIGCAz1+qQhbqhUZFEFWJcGDjRUVPjvD7wAMD0+PpRdXt40AOqDIueoLFEkJ6lucEOkLbSkJHtLXNAoMfKFvABwNphdO3aY1omJEduGvcb2pnIszTh4k' +
  'Al+OkQvAIj/fyQnh0a5ZiDVdUNbc4Bx222GpUvtneBrmwqme79XAOSESmbMMKc88IBl79CoxhfJfuXYBITr3fVb3RQ42jzAZU5+wd0y69ABVqxQY8Te+N' +
  'Rm6+d+gOAVAD1THdlncnJCTJ0asdtcClsS3G13uZ8uAPU/9X99cASae7lOUZ9uQaW6oLAQRo9GOwUXAHt/KgD03LvBzJk6FaWqtuAffOCA4K64hNEKus7' +
  'NFdrVgrog1R3rfte9LiAaq7ri6adhwgT2Az8DDv2UAOjZOpGxfPBgw6pVlh2zBYJWTLFd5ArgMlo38akLRP1x9UFya4N774XsbPsAhPqNvoSjkzGBusBf' +
  'piZFmzamf14ejB2rM35OAySa3R8XJFdLfmxFXQAmToS8PNYBY/1Yffu5PkzUGVgEZoLa1pmZcM01zja4agElPl76gPX5kfDaDdY5Q+0K7dxpN0XVHPWF/' +
  'ADAZeQXylrBXKtDTzfeCImJTsqsyk5AyDy8RAJpkXtKZMECw5132vPpCIzOFvtCfgLgMqQY/TswicOHd4uZOXMINTXPMWiQZe/3y0SUBqtIUhbo+oW6oV' +
  'OAadW1GyxNevLJENpcAUtHX3QExjcKAgCXufUpKbel5uQs4Y03ilm9ejIxMZUkJBi70ztggGV3k9xo4BZFAkWhVWeIdYxm+XLDtm228A8CM3yTvHaioAD' +
  'QsfjKgoKCLlde+St27arikkt+fgxqdHRFKXW/uDhjV3zt21t2Vdixoz6NvYGqo2+VlbYfUcmkM8LLAR2T9Z2CAmBCOBzOKy4upmvXruTm5pKVleW2ttoA' +
  'g2pDmY5Qaz9BVwegHdhxXu8Q6PiD6n99D4yCAuCZG264YfTChQuprq4mPT2dkpKSucC0wCQ5yYmDAECt0g/WrFnTbsSIEWzbto0UtXYC6uicpNz/uy0IA' +
  'CZ369bt8ZdeeolwOMy8efN4+OGH36rN35vKr+/3BwFAQUZGxnWLFy/m8OHDjBkzhtLSUl+TFz9R8BuArsDulStXdho3bhybNm0iLS1N/A72eojZTyFPNJ' +
  'ffAGSEw+FVmzdvJjY2lkceeYS5c+cqa1P21iLJbwCeysjI+M2SJUvYv3+/vfoVFRVKXpTEtEjyEwBtk3/42GOPdRo/fjxFRUW2/dd2b95pkdL7VA26so2' +
  'LiYl5WslPXFycPL/UX9nbxS1VePHlpwbk33TTTenz58+31T81NVXqPx146P8FgH9lZmZevGDBAgoLCxk1apTk1t5OoKlsU8H1UwPWJyUlpU6bNo3MzEzK' +
  'ysqeB07ivbCmiuTtfj8B+Gt8fPxvI5GIVF8vMKlv1yzv/3oT+fuj/QRgjtMttvv1Snz0ZniLJz8B0Jvi6tisrn3xucULLwb/C3wZCn1ODyNFAAAAAElFT' +
  'kSuQmCC';

const webPushPin =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAMDUlEQVR4XuWbDXBU1RXHf+/tbkKQT0' +
  'EIEQho+BCV8lEUba1YjYgQNFCikkGRGUAZrKJQHdGKiCKCKFBEcASsFQ0oxTIEKgxkBqKiEKCGIhCQjxBB+f4ICbtvX+e/L1tSvrIv2cXM9My8YcPe++4' +
  '9v3fuOeee+9Yg9tIceBKMNmDWgeBp4BTYB4DtwDZgE7A39lM5fwQjxoOmgJnTuXPc1XffbdG8uY9jx/wcPQo7d3rZts2moABOnrSOQXAzWOuBVcAa4OcY' +
  'zy10+1gDGA9xz504YVOrlv8cfTS0yeHDHjZvtlm3zsPKlQYrVwYpLrYOgPUl2IuBJcBPsYIRYwDGpz16xPV9551SWrSIRAWTn37ysHq1yfLlsGiRwYEDg' +
  'f0Q/AKCHwPLIrmLmzYxBmDOefxxz8AJE/x88gl07w7N5REiEoPiYi/Z2SYLFxp8/LENBL4F62/AbOBkRLepoFGMAfB8crLv1YICi7y8IDk50KwZPPSQ26' +
  'kbbN/uIyvL4N13bfbtCxRAUBDeAY65vVv59rEG0A18q774AlJT/Xz/PSxdCn4/tGsHvXq5n3pJiYepUz3MmmWwY4dfIMYAH7m/k9Mj1gA0RE7HjvG35+b' +
  '6CQatkPJbtsCaNVBcDImJcP/90LixOxWCQS9jx5q89pqAnpGzHAwotLqSywCAJmDmpaXVSJwzp1QeHsOAunUhLw9WrnQsomFD6NgR7rjD1fzZsSOOIUMU' +
  'Pfy7IdgHyHNzh8sBQPNpB54lffr4WkyZUkIgAKYJtg1NmsCuXaBlsmOHA+aaa+C666BLl0hV8ZCR4WPBgtJDYHcACiPtebkAaCmsmzbN2/mBB/yhEKdo0' +
  'KoVlJZCSYkDIhh0rCI/H4qK4IorHKep5dG6tQPm4uKlVSsfBQWnpwBPVTcAXcHz1cGDBg0aBEIKrl8PNWo4ygmELOLkSfD5nOUgKPIVso59+xx/ISD6Tr' +
  'Bq1oSEBPB64cQJSEqSFdRg06ZTfwGeqG4A/typk+/l9estAoEgBw86T37nTudJaylcdZUDQ8ppiQiAoNSq5YA6dAj27HHaC4asRcAsC269FVasiGPMGEu' +
  'O9rdAbjUDYKwZP977m+ee84cU+flnR+k6dcDjge3bHQVPnXL+btAAatd2gAjAmTMOFD3tuDgHiD7LAhTI8vO9oZC6e7d/JvBYpMpfpjBIS/Bs/+47w3PD' +
  'DQEKCx2TVSTQJRBSRCatTZJMXtYhGIoOUliOUeYvCE2b6m+T0lKToiKDOXOc5Aj8c4FH3Sh/uQAMadIkbmZRkQVYIbOXeetJlxeBEBCBkNKC8OOPjmVIt' +
  'By0THJy4pg/38Phw0EKCoJKj78DezygvYJruQxRwPhsyBBvn5kz/Rw/Dvv3O+tWCl1KBEQOUeYuMOqjiNCzp4fsbOsrYHpZ4rMaKHWteVmHWAOoC+auZc' +
  'uMet27WyEHduzYWfN3M2n5hcJCk65dZf6BdGCRm/4XaxtrAPf7fN6/Hztmk5Bg8cMPcPr0+eZfkSLy+EqMXn7Zy5gxqiRZLQFVlqossQYw/Z574oYtXeq' +
  'npMQOhbFIzP9creQv5Pxuu83LunWBGcCwKmt+GZaACZ6t77/vSRk06Exo7R854t785Quk/DffeLnzTs068DtA6z4qEksL6AKebxTzGza02L37bJx3M3MB' +
  'aNsWhg6NY9aswL8heL2b/hW1jSWA0R06eMZt2BDEsuxQ+FNcPzf8VTRB5Qg+n0mnTib79wf+DLxSUR8338cQgJEzerT39nHj/KHUV5eeZkXhr/zk1V77h' +
  'PnzvfTvr2THagtsdaNgRW2jCUCJ6Y1Aa+B6iHty82Y7oV07P3v3Otmf26evyWsXmJ7u4/PPAyvATq1IIbffRwNAfWAoeAcZhtnq2mtV2DBISTEZO7YE03' +
  'TMX/m8WwD16ik99tCpkwqkAaW5SnejKlUFMBI8T7Vu7bt61CgD5/BD6WmQYDAYSmd1KQJUxvzl/N5+28eIEcHjYKmwfiSq2lexJph15ZVxGRMnGgwaJKX' +
  'PHnwcPuzk8Fq/2vwoBdbaV0obqah98+YG3bp5+fpr/wfAwEj7umnnYkr/c9tFKSme+3JzDRo1Cpw3njI+ScuWTplLVuDW/FUs3bLFwy23aIqBe4B/ulEs' +
  '0raVAfBSfLxvzK5dNomJ5yuvgeXwtK1NTna8/4V2f5eaYDj2jxrlY9IkayMEO0aqkNt2bgHcDt6cVas8dOt26Q2Y1v3mzWfLV4IQ6RLQljg+3iQpyYdll' +
  'U4D/uhWsUjbuwRgbHjssRodZswoARSXLy1a/5s2gbx5UpKzD9BV0dNX+337TJYs8fHSS4EjYD0JfFjReJX53g2Arh5Pwld6sg0bRr4RkwPUiZB2dCpjhc' +
  'tgAiFTP1fkK7Rl1jg9e8KCBT4yMuRkrV8DOj6PqrgBMKRly1ozd+48A+hyJ9oT6FI+IKeoYkd8vAOlvIMUmK1bnQRIYVA1v5Ej43nzzdK9YCvRqtJZ4Lm' +
  'zdgNgXI8eCaOzsyMz/4vhUT0gXACVBQiGan2ykHCobNTI2QGeFZMbb/SQn++Puj9wA2B0+/Y1x23apKd/Ye/vziac1nKOsorQszacavCFZMUKD6mpwZNg' +
  'Xw0cr8xYF+rjBkBLiN+Wl+fxduxYHHJmbmN71SZt0qyZSWFh4OFoOkQ3APSM/tGjR0JadracoB0y3XBoiz0Mg2HDvMyYEVgMdu+qwTzb2yUA7faM9S+84' +
  'PO98sqZ0AmN9vgSrV85NoEIe3f9X/kUONI8IDw9+QX10RmBDkhmzTIZOlQHn8F2yreiAcEtAI2ZDt6F06Z5GT68lKNH7dCBhhTXZMMKhz+HIZT/t/x3YS' +
  'iCFr7CTjF8RCZHqcPUxYs99OnDIbB+Bez7pQBo3FEQ98bw4QYTJ57BMJzX3QQhDEDK6AmGnVt5OOf+X/m24c/qGwaivtpXZGV5eeQR+0ew2gMHf0kAGns' +
  'wmLNuvtnH3LkB2ra1QhD0tBTbJWEFwhMtn/iEn3z4eOxi34W/V07w4otexo2z8sDWmwNleKuGoTJLoPyIt4Axt359X+sZM6BfP70G4xRAIi1/hxW/lH8I' +
  'b44efdTD3LnWZ8AfqqZ25Z3ghcatB0wB38OpqSZPPGGTluYnELBDtQAlPm7qgOcOIOV1PNaihUGXLibr1lkqiqo4GhWpqgWUn8RtYIwEX+/0dIOBA206d' +
  'HAyHKW8ihhaHm4igaxIp8LaVk+eHM8zz2gnFdArMHq3OCoSTQDhCfUGYzjEdUhNbXzV8893oLh4KZ07+0Pn/XJuCmva8CgLDC+B8qFTp8Mqh+s0OBAw+f' +
  'DDOAYNkvJ+vfqiV2CiJrEAEJ7col69ht03Zcp08vJWkpX1OA0bbqNdu3hSUmzatAnSuLGNYThvjYU3RSUlBkeO6B1ik/XrTWbPNli9OqT8q8ALUdO87Ea' +
  'xAlAH2LVgwYL6d931e7Zu3UPXrnedgkO54GsJRqsWLczQS081a1qhJVK7tk18vBE6P9y1y0Nhoc2JE0G9JqFz/1nAt9FWXveLFYCHk5OTP1i6dCkNGjRg' +
  '+vTpjB07diOg0lYNoBOgUJYMps4TEsCuBdQExfnQbwj2lO3/9TlmEisACwcMGJD+1ltvcfToUTIzM1m7du1E4E8x06SSN44FgERgx7x582ree++95Obmk' +
  'paWpnOCmFR0Kqn3f7vFAsCgZs2avZ+dnU2TJk2YNGkSr7/++r8A5e/VTmIB4NPMzMy+U6dO5eDBgzz44INs2LAhqslLNClGG8CVwM7Zs2fXzcjIYPny5a' +
  'Sn63UeOrt9iTmaSl7qXtEG0D85OfmjJUuWkJiYyIQJE5g4caKyNmVv1VKiDeCTzMzMBxT2ioqKkBXk5+creVESUy0lmgB0TP7De++9V7d///4sW7aMvn3' +
  '7SmlVb7ZUS+2jnAj1a9q06XwlP0lJSfL8Mn9lbzdVV+WjnQlmDR48OENhT+bfr18/mf9o4LX/FwBrR4wYcdPkyZNZvHgxvXuHCrdtytLaassgmj5gUffu' +
  '3e97+umnefbZZ9m4cWM20LPaal42sWgC+Gv79u0H6NWY/Pz83WWbncvy+9+qQI4mgDecanGoXq/ER78Mr/YSTQApZT9Wmgd8We01L5vgfwDsYmp9ZiTvE' +
  'wAAAABJRU5ErkJggg==';

const textBase64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAAXNSR0IArs4c6QAAAARzQklUCAgICHw' +
  'IZIgAAAPiSURBVHic7dhbiFVVGAfwn5pFgWVFGVRkmqaJZkgJifTQQ/UgFGXRTYoghG5IQVeKbiTWSyIadLWkAolKerFCK3oYIsskSjPpShJDRdlVy3pY' +
  'e3DP8ZyZc4ZxrPz/4HA463x7f9+Zvde31h4iIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIi4j9rxN4u4F9uMU7Dm0OVcHgHsYfjb7zRMD67Gl80S' +
  'DX1ZToexDvYgpdxHQ4cgtxDopMLAl9hHA6rjZ04eOX06Vy8jwNwKy7FcxiN34aohj1uvw7jf1LuzvH4vhqbipcGs6gmxuJx3IaFyoyErj2cd8h1OkMmYE' +
  'P1DsOUlrW+Ie4QXI2V+ARrcAcObYhbirm4GGur2Pv1noFwHrbhEbsuRjPt5qXMtCuVtvelcnGXKK257k9chNewEY9icpPzHae00414D7dgVB+1NtXpBdk' +
  'fn+Kk6vMYHF2N1f1RfbcMc3Cv0nJuanLOGzERN2Cesk480BAzGy/ih37qazfvcDyEa/AEzsK1WGfXzO9xPs5U2uRc7MBjeq9bY5QLux0XYj5mNPkdg6pn' +
  'UZ+M1dXYLDxZFdrfoj7P7jNpKd7Wu3WeUuWZVBv7CAsGVHXzvDOrHDP6OXaxMtPqd/rY6tiptbEFygwaWRubVMVN66TYTmcIfK1Mz4OVBf3dNo/7Bifbf' +
  'avdpbSFHh9W7+NqY8Pxe8eVts47XdkgrGvj+NeVdtmju3qvt8EzqrgdtbEtyow5oZNiO13UYafS78djClbhyIaYETi7ek2sijqixfl+bPi8A5v1/sGbcV' +
  'QbtbWbd7Td22wr3S3G6zfzMcpmY2GTuFa/u9+TdmK9srDPUhaxRvNxN17AZcr0ndviXI0L38jq3N/VxrqUPt/fDdRu3p+V1tOOnW3EbMWdOL7Ja2WbeTD' +
  'wC7IJ5yhT8tsm38/BU8pDZLdy109oEkdZsOu9t6c3f1Ybe0Xp+5f0U1e7edfjVB329z6sUdr3F/i84dW4SejTQFoWZaG7Ave1+P5jpa++qux8ZuKCFrGj' +
  'lLv6eRyEu5Rd0qZazAfKwrlcaZVr8auyuxmFZzvM26U81yxTttlbqtzTlBbc326u0Qpla3yPshv8RWlVp1c5trU+tLeBzpCtyqK4ocX3i5TFf5XSPsbi8' +
  'haxy5U/5BI8rezhb28S97CyNhyrPI+swFXKs1Cnef9S/uXyDK7HW1X+KXpvMNrVrTwrba9qW42bq8/bB3C+vWap5n/8fdZAZ8hgGtZ/yL7j33BBoiYXJC' +
  'IiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIi/qf+Adu8yYZ5H7HEAAAAAElFTkSuQmCC';

const webTextBase64 =
  'data:image/png;base64,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' +
  'SqYPsPyfIwdMABxUcAAAAASUVORK5CYII=';

describe('Canvas tests', function () {
  beforeEach(function (done) {
    if (isWeb) {
      Canvas.registerCanvasAdapter(HtmlCanvasAdapter);
      Canvas.initializeAdapter().then(() => {
        done();
      });
    } else {
      Canvas.registerCanvasAdapter(CanvasKitCanvasAdapter);
      Canvas.initializeAdapter().then(() => {
        done();
      });
    }
  });

  it('should register the canvas adapter', function () {
    if (isWeb) {
      Canvas.registerCanvasAdapter(HtmlCanvasAdapter);
      (Canvas.adapter instanceof HtmlCanvasAdapter).should.be.equal(true);
    } else {
      Canvas.registerCanvasAdapter(CanvasKitCanvasAdapter);
      (Canvas.adapter instanceof CanvasKitCanvasAdapter).should.be.equal(true);
    }
  });

  it('should initialize the canvas adapter', function (done) {
    if (isWeb) {
      Canvas.registerCanvasAdapter(HtmlCanvasAdapter);
      HtmlCanvasAdapter.initialized = false;
    } else {
      Canvas.registerCanvasAdapter(CanvasKitCanvasAdapter);
      CanvasKitCanvasAdapter.initialized = false;
    }
    Canvas.adapterInitialized().should.be.equal(false);
    Canvas.initializeAdapter()
      .then(() => {
        Canvas.adapterInitialized().should.be.equal(true);
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        done();
      });
  });

  it('should fail to make canvas when adapter has yet to be initialized', function (done) {
    try {
      Canvas.create(100, 100);
    } catch (e) {
      e.message.should.be.equal('Canvas adapter not initialized.');
    } finally {
      done();
    }
  });

  it('should make a canvas', function (done) {
    const canvas = Canvas.create(256, 256);
    should.exist(canvas);
    Canvas.disposeCanvas(canvas);
    done();
  });

  it('should fail to make an image', function (done) {
    if (isWeb) {
      HtmlCanvasAdapter.initialized = false;
    } else {
      CanvasKitCanvasAdapter.initialized = false;
    }
    Canvas.createImage(pushPinBase64).catch((e) => {
      e.message.should.be.equal('Canvas adapter not initialized.');
      done();
    });
  });

  it('should draw an image from a base64 png string', function (done) {
    this.timeout(5000);
    Canvas.createImage(isWeb ? webPushPinBase64 : pushPinBase64).then((image) => {
      const canvas = Canvas.create(64, 64);
      canvas.getContext('2d').drawImage(image.image, 0, 0);
      const dataUrl = canvas.toDataURL();
      Canvas.disposeCanvas(canvas);
      dataUrl.should.be.equal(isWeb ? webPushPinBase64 : pushPinBase64);
      done();
    });
  });

  it('should draw an image from a web address', function (done) {
    this.timeout(5000);
    const canvas = Canvas.create(64, 64);
    Canvas.createImage('http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png').then((image) => {
      canvas.getContext('2d').drawImage(image.image, 0, 0);
      canvas.toDataURL().should.be.equal(isWeb ? webPushPin : pushPinBase64);
      Canvas.disposeCanvas(canvas);
      done();
    });
  });

  it('should draw an image from a file', function (done) {
    this.timeout(5000);
    const canvas = Canvas.create(64, 64);
    Canvas.createImage(path.join(__dirname, '..', '..', 'fixtures', 'pushpin.png')).then((image) => {
      canvas.getContext('2d').drawImage(image.image, 0, 0);
      canvas.toDataURL().should.be.equal(isWeb ? webPushPinBase64 : pushPinBase64);
      Canvas.disposeCanvas(canvas);
      done();
    });
  });

  it('should fail to load a bad base64 image', function (done) {
    this.timeout(5000);
    Canvas.createImage('data:image/png;base64,badimage').catch((e) => {
      if (isWeb) {
        e.type.should.be.equal('error');
      } else {
        e.message.should.be.equal('Failed to create image.');
      }
      done();
    });
  });

  it('should fail to load a bad url', function (done) {
    this.timeout(10000);
    Canvas.createImage('http://maps.google.com/mapfiles/kml/pushpin/bad-pushpin.png').catch((e) => {
      if (isWeb) {
        e.type.should.be.equal('error');
      } else {
        e.message.should.be.equal('Failed to create image.');
      }
      done();
    });
  });

  it('should fail to load a bad file', function (done) {
    this.timeout(5000);
    Canvas.createImage(path.join(__dirname, '..', '..', 'fixtures', 'pushpin_not_found.png')).catch((e) => {
      if (isWeb) {
        e.type.should.be.equal('error');
      } else {
        e.message.should.be.equal('Failed to create image.');
      }
      done();
    });
  });

  it('should measure the text', function (done) {
    this.timeout(5000);
    const canvas = Canvas.create(100, 100);
    const ctx = canvas.getContext('2d');
    Canvas.measureText(ctx, null, 16, 'MapCacheMapCache').should.be.equal(
      Canvas.measureText(ctx, null, 16, 'MapCache') * 2,
    );
    Canvas.disposeCanvas(canvas);
    done();
  });

  it('should draw the text', function (done) {
    this.timeout(5000);
    const canvas = Canvas.create(100, 100);
    const ctx = canvas.getContext('2d');
    Canvas.drawText(ctx, 'MapCache', [50, 50], 'Noto Mono', 16, 'rgba(0, 0, 0, 255)');
    canvas.toDataURL().should.be.equal(isWeb ? webTextBase64 : textBase64);
    Canvas.disposeCanvas(canvas);
    done();
  });
});
