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
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAC1JJREFUeF7lmwlwVdUZx3/ngcomm4a8gCyObDFaI4hLtYVijCWICQipZCwDqLjQ1mZUximIGKMo24AklEWlaQWMBMvUuITF4EhxKkZQk2hQMRJZlKVES9zw3c7/3twaYyTvkntjZvrN3Hlv3jv33O/7n28/5xqCp17AHcAAoCPwBXAM+AR4D9gFvAlUBc/KD59gAn5oX2DLBReEeqSkWPTubTh61OLoUXj/fcM770BFBRw/blWDVQaUAMXAVuBgwLzZ0wcNwGww93z+OXToYDUoz5EjhvJy2L7dsGkTvPiiRSRiSTu2Ac8CzwGfBgVG0AAUJCeb65Yv1+pHJ8Knnxq2boWiIsjPN1RXRw4AG4A1wIvRzRL9qKABWHnrrWbinDkW+flw9dXQs2f0zNXUGF54AdauNeTnS4Os7cCTwBPAf6Kf6cdHBg3An8Jh82BVlcWOHVBcDL16wfXXe2ddPuOpp2DRIjh0yHq/FoQlQLX32b67I2gAhoEp3rgRkpIs2+E9/zx88w0kJMDIkd5Z//JLePRRQ04OVFXZQMwCVnmfybkjaAD0jC3nnRca+tprESIRR/h334VXXoGaGoiLg9RUiI31JoLmysoyZGWBZVlyljfXhlZPEzUHAHHAGyNHhsJ5eRG++AKMgY4dsc1i82YHlDPPhEGDYNgwT/yze7dh8mR4+WXrI2CMnuVlhuYAQPycq3CWlhbqk5MT4fhxCIW0chAOw0cfwYYNyg2gUyc45xyIj4eLLopelLFjQ6xbFzkMJAIfR3tncwEgfl7PyTGD09MtO97LGfbtC19/DbJrASG1lla8/Tbs2wft2zvjZB79+8PZZ59YrN69Q+zZE1kE/LGlAXAp8OqhQ3DGGVBWBiUl0KaNI1y/fo5ZHDsGp5zijBEo8hWVlfDxx46/ECAxMY7faNcO2raF1q1BiVb37pCW1ory8m9zgN+3NABmnn++uf+ttyxb/QWEVn73bmelZQoSTGBIE7791gFAZiKhBdSRI7BnjzNeYEhbJLjGXn45bNxomDnTzjavAP7Z0gDYOnu2ufyeeywOH3YAkNByhBJStq/fpQGtWjkacPrpDiACQE5SwGm1pSECRN+lAaKyMkNSEhw4YC0Dbo1W+OYKg7Lc90pLaaXYv3evs3JSeV0CQoLoqq52VP6rrxwwJPippzqOUUAIhLPOcoCTBu3bZ3j8cVgmsbH+AkzyInxzATClSxez7MgRpxj68ENHvbXSdUlACBDZtlZZAu7f72iGSJoiMykuNqxebZQN2iYB1tvA7Npawav8zZIIrbv5ZjNGBdFnn8Ennzh2K4FORALEVXeNk81r9UeMUMXIq0BubeLzCvCVZ8lrbwg6DHYCKouK6Jyc7DgwgeCqvxemu3Z1zOfCC22zGQ2s93L/j40NGoA0Y/i77Fk2LvtWJlhf/RsTRKs/cCDcfz/MmmV3kuRX1FlqMgUNQO5VV5nbN2ywbLuvqopO/etLJcB69IDLLoOdO/kzcHuTJW8GE5CVVzzxhOk7aZLFgQPYrTCv6i9fIOG3b4fhw22ufwnI7n2hIDVgCPDawYNOoSOP7cZ5L5wLgAEDYMoUw4oVVjmQ4OX+xsYGCcD0hASyS0sdtVf4U1z3av9uunvuubYGzQQeaEwoL/8HCcCW6dPN0Oxsy878FM+1mo2Fv7rMa7wKprVrYfx4+5+BMisvAjY21k8AlJieD/R31NTcUV5O2/h4yy5mlP15XX0xr0IpNdXw7LPWJuCqxgTy+r8fAHQBbgEmg+mn8nXIEJWv6tZE7BWX+iuz8wqAUmClx+oNRCJ2mqt011dqKgB3qfbu0yfUY8YMSE626NnTSXkVu5XT61L2dzLqL+e3cKEhM9P6DOgD/NtX6ZvYE8xv29ak5+bCJLsE+W7jQ6WrLtmvsjdlf9IEhcBoSePVQr/iCsPrr1t5wMRo7/UyzgNL35t2fa9epCo2d+v2w8cp4xP16ePU/NICr+qvUlgNkUvVSoFfA0VeBIt27MkAcJ8xZta+fZbdvGiI5PDU55M/kPdvqPo7EYNu7L/7bsO8edZO4MJoBfI6zisAQ9Xm3rLFMHRow3t9LgPK/LTn57avBEK0JqCSWH2A2FixZy0G/uBVsGjHewVgxy23hBKXLo1ENb/s/803oXNnp2enhEhXY6sv76/KsbDQcN99lhyfttf/FtVDPQ7yAsClEHrVSW2jA0C8yAFqR0hRQW0sdXPkDwSEVL0+6T+FPmlQSgoUFBjGjbMHqkmu7XNfyQsAU7p3b71s714t4YnVvyEOBZzbDJVTVLPjtNMcUOo6SAEjwNQGVxgU3XVXiPnzIzpAoUSrSXuB9XnzAkB2cnJoelFR9KvfEBDqByhEqjCSBggM9fqkIW6oVGRRBViXBg40VFT47w+8ADA9Pj6UXV7eNADqgyLnqCxRJCepbnBDpC20pCR7S1zQKDHyhbwAcDaYXTt2mNaJiRHbhr3G9qZyLM04eJAJfjpELwCI/38kJ4dGuWYg1XVDW3OAcdtthqVL7Z3ga5sKpnu/VwDkhEpmzDCnPPCAZe/QqMYXyX7l2ASE6931W90UONo8wGVOfsHdMuvQAVasUGPE3vjUZuvnfoDgFQA9Ux3ZZ3JyQkydGrHbXApbEtxtd7mfLgD1P/V/fXAEmnu5TlGfbkGluqCwEEaPRjsFFwB7fyoA9Ny7wcyZOhWlqrbgH3zggOCuuITRCrrOzRXa1YK6INUd637XvS4gGqu64umnYcIE9gM/Aw79lADo2TqRsXzwYMOqVZYdswWCVkyxXeQK4DJaN/GpC0T9cfVBcmuDe++F7Gz7AIT6jb6Eo5MxgbrAX6YmRZs2pn9eHowdqzN+TgMkmt0fFyRXS35sRV0AJk6EvDzWAWP9WH37uT5M1BlYBGaC2taZmXDNNc42uGoBJT5e+oD1+ZHw2g3WOUPtCu3caTdF1Rz1hfwAwGXkF8pawVyrQ0833giJiU7KrMpOQMg8vEQCaZF7SmTBAsOdd9rz6QiMzhb7Qn4C4DKkGP07MInDh3eLmTlzCDU1zzFokGXv98tElAarSFIW6PqFuqFTgGnVtRssTXryyRDaXAFLR190BMY3CgIAl7n1KSm3pebkLOGNN4pZvXoyMTGVJCQYu9M7YIBld5PcaOAWRQJFoVVniHWMZvlyw7ZttvAPAjN8k7x2oqAA0LH4yoKCgi5XXvkrdu2q4pJLfn4ManR0RSl1v7g4Y1d87dtbdlXYsaM+jb2BqqNvlZW2H1HJpDPCywEdk/WdggJgQjgczisuLqZr167k5uaSlZXltrbaAINqQ5mOUGs/QVcHoB3YcV7vEOj4g+p/fQ+MggLgmRtuuGH0woULqa6uJj09nZKSkrnAtMAkOcmJgwBArdIP1qxZ027EiBFs27aNFLV2AuronKTc/7stCAAmd+vW7fGXXnqJcDjMvHnzePjhh9+qzd+byq/v9wcBQEFGRsZ1ixcv5vDhw4wZM4bS0lJfkxc/UfAbgK7A7pUrV3YaN24cmzZtIi0tTfwO9nqI2U8hTzSX3wBkhMPhVZs3byY2NpZHHnmEuXPnKmtT9tYiyW8AnsrIyPjNkiVL2L9/v736FRUVSl6UxLRI8hMAbZN/+Nhjj3UaP348RUVFtv3Xdm/eaZHS+1QNurKNi4mJeVrJT1xcnDy/1F/Z28UtVXjx5acG5N90003p8+fPt9U/NTVV6j8deOj/BYB/ZWZmXrxgwQIKCwsZNWqU5NbeTqCpbFPB9VMD1iclJaVOmzaNzMxMysrKngdO4r2wpork7X4/AfhrfHz8byORiFRfLzCpb9cs7/96E/n7o/0EYI7TLbb79Up89GZ4iyc/AdCb4urYrK598bnFCy8G/wt8GQp9Tg8jRQAAAABJRU5ErkJggg==';

const webPushPin =
  'data:image/png;base64,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';

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
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAAXNSR0IArs4c6QAABptJREFUeF7tnHWIplUUh581EbHFFhM7UBQVW+wWuxM7sDtRFLG7C7ED7PhHTGzswsRG7MbigfPCxzAz7J1vvN5dz4Vld7457z3n/T33xP3+2DHkakqBMU1Fk8GQQBo7BAkkgTSmQGPhZIYkkMYUaCyczJAE0pgCjYWTGZJAGlOgsXAyQxJIYwo0Fk5mSAJpTIHGwskMSSCNKdBYOJkhCaQxBRoLJzMkgTSmQGPhZIYkkMYUaCyczJAE0pgCjYWTGZJAGlOgsXAyQxJIYwo0Fk5mSAJpTIHGwskMSSCNKdBYOJkhCaQxBRoLJzMkgTSmQGPhZIYkkMYUaCyczJAE0pgCjYWTGZJA/hUFJgJmBb4HvgkPMwGf9+HNw7oI8AbwRx/7FD3ab4ZsBBwNLA18CcwB/DpIBLsDl8bn1wAHAt8WRTq48bLAGeH3eWAqYF7gfeBtYLcR+lgMuBFYCJga+G6E+xQ/1i8QHXqKXgnPOwMK3rsmAD4EZgNeBhYvjnLwB4R6FnA2cATwe5jNA9wBvAls2YevPYGLx0UglgZP4xTx94LAXz1CrAkcA6wIPAisPQgwoQ1XFiYE/ux5bgngBeBZYBng7wF7mrHHA+v3fD5x+Bho25l4OHt/txNw9bgK5Jao15sD6wL39whxH3AZcOcAINMAJ4VIPvMkYGlTuB2AHYF7ohxaGs2ubYFXgSuAXYGtgJuHyAKhvQhYfg6IUrohcBpwYc8zxuy+k8RnJ0csHZBN4vlVgPOB/cNOgGapzy8cJe4Q4Ic+snJU/vMZM0Qglo0ngEeAVSOoBUKwlaPZ9mbI6cCmgCVmFuCTeO4ZYI8oRx8DewPLAUf2ANXGLFgKsHcMt14KgfcK8Yx1sgC0GXBi7PVLwHYvBe6AGPMpwDaAZWzJAH0wMCewH7BeHJ4L4ucRMxmNHtIBWQnohFKs54DzorSYHTbxXiCebk/vUdGM/b0vbPOfC3gvmvKV8XaWD0WyNL4LzBAwtRtumRFCuxVYBzBj7XuvAx8Bl0emuofvIAx7RwfE3udhWTSydIsQ/wvgIuCtcH5VDDYzjpgGjGqG+DI20ZuAG4B94wXmi3IwEIhxC9Ny4si6fZSAc2Jq+iA+uz5e0LLiv9cCjgOWj770+FgI4CBhqZkdWCMy67MQ2v0eGmSPDsjMUY67LLaUCtjSucuA0doe9MBYxDOkyWhniPXfMuPpvQTwFJ3QkwG9GeIptW9YNh6OQcCaPBSQ7nQLYusA3tkPp4H9yAYvCA+AZdVS91tMh5ZCs2jgGg6IQ8xTBQdirBmNBhBP921R53VsbfVu4PJ3n8ak4oWtF8hrgH8sAU5RTlnDAXEAOBaYFpgOeCdKxNzAT4O8saLr23KzT5SXFYDHAoiiepF0WrPEdpOhGXstsHFMWYNliBllhjniO+p3y2fNkK6MjTWIznA0gPgyTkOmtKOp09PXUV4sQ66u/irC/PGZ2eNaDdgAODWyw0nGfSxZNv7DgUmjPwn0sHju0Pi9AptlXkxdxnFQALbveB+5F9De5uzUZIY9GplhjPaX2yOLvooBxT3OjMuht3UviR6g7tD4zjZzY3R/Bxn7h0PIiFe/QLaLoC1Rlh3HVoU8N/rI0xGoGeN04rK/eGIVwqavkJ58R1Jf0M8V2X1s2F46rf3+7f7dBdC9vNM4wpolliIPw/Rx77FZuxyLzULHZgcIm69r9cgef3asdjlAODV5l/Kmbv+7OyB4AfXgeKjMHrPrrp73Eoqxd1/djAhKv0BG5LTnocmBn+NCZizeBaztfgXTNXXLgyPpcPO9IPzKRDF8buAl08mse14f/r738jpl/PzjCF7IjPSQmFl9r/8ayFAv4Hzv91FONNf1/Zbj0AYtAjEmx2dLhjd8a7ZZ9L9YLQLxImbN75ZT0lBfj4x3kFoEMt6JXPJCCaRErQq2CaSCyCUuEkiJWhVsE0gFkUtcJJAStSrYJpAKIpe4SCAlalWwTSAVRC5xkUBK1Kpgm0AqiFziIoGUqFXBNoFUELnERQIpUauCbQKpIHKJiwRSolYF2wRSQeQSFwmkRK0KtgmkgsglLhJIiVoVbBNIBZFLXCSQErUq2CaQCiKXuEggJWpVsE0gFUQucZFAStSqYJtAKohc4iKBlKhVwTaBVBC5xEUCKVGrgm0CqSByiYsEUqJWBdsEUkHkEhcJpEStCrYJpILIJS4SSIlaFWwTSAWRS1wkkBK1KtgmkAoil7hIICVqVbBNIBVELnGRQErUqmD7D8nyMHTAAcVHAAAAAElFTkSuQmCC';

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
    Canvas.createImage('data:image/png;base64,badimage')
      .then(() => {
        console.error('fail');
        done('failed');
      })
      .catch((e) => {
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
