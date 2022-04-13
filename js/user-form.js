import {isEscapeKey, checkLineLength} from './util.js';
import './slider.js';
import {sendData} from './api.js';
import {filterElements, updateEffectSlider} from './slider.js';
const uploadForm = document.querySelector('#upload-select-image');
const uploadFile = uploadForm.querySelector('#upload-file');
const uploadFormCloseElement = uploadForm.querySelector('#upload-cancel');

const hashtagsInput = uploadForm.querySelector('[name="hashtags"]');
const descriptionInput = uploadForm.querySelector('[name="description"]');

const scaleSmaller = document.querySelector('.scale__control--smaller');
const scaleBigger = document.querySelector('.scale__control--bigger');
const scaleControl = document.querySelector('.scale__control--value');
const submitButton = document.querySelector('.img-upload__submit');
const picturePreview = document.querySelector('.img-upload__preview').querySelector('img');
const FILE_TYPES = ['jpg', 'jpeg', 'png'];

const onUploadFormEscKeydown = (evt) => {
  if ((isEscapeKey(evt) && !document.querySelector('.error')) || (isEscapeKey(evt) && document.querySelector('.error.hidden'))) {
    closeUploadForm();
  }
};

const onInputFocusout = () => {
  document.addEventListener('keydown', onUploadFormEscKeydown);
};

const onInputFocusin = () => {
  document.removeEventListener('keydown', onUploadFormEscKeydown);
};

const openUploadForm = () => {
  document.querySelector('.img-upload__overlay').classList.remove('hidden');
  document.body.classList.add('modal-open');
  document.querySelector('.effect-level__slider').classList.add('hidden');

  // Замена изображения
  const file = uploadFile.files[0];
  const fileName = file.name.toLowerCase();

  const matches = FILE_TYPES.some((it) => fileName.endsWith(it));

  if (matches) {
    picturePreview.src = URL.createObjectURL(file);
  }
  // Сброс стилей
  picturePreview.removeAttribute('style');
  picturePreview.removeAttribute('class');
  // Масштаб изображения по умолчанию
  scaleControl.value = '100%';
  // Добавляем обработчики
  document.addEventListener('keydown', onUploadFormEscKeydown);
  uploadFormCloseElement.addEventListener('click', closeUploadForm);

  hashtagsInput.addEventListener('focusin', onInputFocusin);
  hashtagsInput.addEventListener('focusout', onInputFocusout);

  descriptionInput.addEventListener('focusin', onInputFocusin);
  descriptionInput.addEventListener('focusout', onInputFocusout);
  // Добавляем обработчики кнопок масштаба
  scaleSmaller.addEventListener('click', makeScaleSmaller);
  scaleBigger.addEventListener('click', makeScaleBigger);

};

function closeUploadForm () {
  document.querySelector('.img-upload__overlay').classList.add('hidden');
  document.body.classList.remove('modal-open');
  // Сброс полей
  uploadFile.value = '';
  hashtagsInput.value = '';
  descriptionInput.value = '';
  // Убираем обработчики
  document.removeEventListener('keydown', onUploadFormEscKeydown);
  uploadFormCloseElement.removeEventListener('click', closeUploadForm);
  hashtagsInput.removeEventListener('focusin', onInputFocusin);
  hashtagsInput.removeEventListener('focusout', onInputFocusout);
  descriptionInput.removeEventListener('focusin', onInputFocusin);
  descriptionInput.removeEventListener('focusout', onInputFocusout);
  filterElements.removeEventListener('click', updateEffectSlider);
  // Убираем обработчики с кнопок масштаба
  scaleSmaller.removeEventListener('click', makeScaleSmaller);
  scaleBigger.removeEventListener('click', makeScaleBigger);
  // Сброс стиля изображения
  picturePreview.style.transform = '';


}

uploadFile.addEventListener('change', openUploadForm);

// Функции масштабирования изображения
function makeScaleSmaller () {
  if (scaleControl.value !== '25%') {
    scaleControl.value = `${Number(scaleControl.value.slice(0,-1)) - 25  }%`;
    picturePreview.style.transform = `scale(${ scaleControl.value.slice(0,-1)/100})`;
  }
}

function makeScaleBigger () {
  if (scaleControl.value !== '100%') {
    scaleControl.value = `${Number(scaleControl.value.slice(0,-1)) + 25  }%`;
    picturePreview.style.transform = `scale(${ scaleControl.value.slice(0,-1)/100})`;
  }
}

// Валидация
const pristine = new Pristine(uploadForm, {
  classTo: 'text__item',
  errorClass: 'text__item--invalid',
  successClass: 'text__item--valid',
  errorTextParent: 'text__item',
  errorTextTag: 'p',
  errorTextClass: 'text__error'
},false);

pristine.addValidator(descriptionInput, checkLineLength,'- длина комментария не может составлять больше 140 символов;');
pristine.addValidator(hashtagsInput, checkHashtags, getHashtagsErrorMessage);

function checkHashtags () {
  if (hashtagsInput.value === '') {
    return true;
  }
  const userHashtags = hashtagsInput.value.split(' ');
  const userHashtagsLowerCase = userHashtags.map((element) => element.toLowerCase());

  return checkHashtagsNotation(userHashtags) && checkHashtagsQuantity(userHashtags) && checkHashtagsUniqueness(userHashtagsLowerCase);
}

function checkHashtagsNotation (hashtags) {
  const re = /^#[A-Za-zА-Яа-яЁё0-9]{1,19}$/;
  for (let i = 0; i < hashtags.length; i++) {
    if (!re.test(hashtags[i])) {
      return false;
    }
  }
  return true;
}

function checkHashtagsQuantity (hashtags) {
  return hashtags.length <=5;
}


function checkHashtagsUniqueness (hashtags) {
  const uniqueHashtags = new Set(hashtags);
  return hashtags.length === uniqueHashtags.size;
}

function getHashtagsErrorMessage () {
  return '<p>&mdash; хэш-тег начинается с символа # (решётка);</p><p>&mdash; строка после решётки должна состоять из букв и чисел и не может содержать пробелы, спецсимволы (#, @, $ и т. п.), символы пунктуации (тире, дефис, запятая и т. п.), эмодзи и т. д.; </p><p>&mdash; хеш-тег не может состоять только из одной решётки;</p><p>&mdash; максимальная длина одного хэш-тега 20 символов, включая решётку;</p><p>&mdash; хэш-теги нечувствительны к регистру: #ХэшТег и #хэштег считаются одним и тем же тегом;</p><p>&mdash; хэш-теги разделяются пробелами;</p><p>&mdash; один и тот же хэш-тег не может быть использован дважды;</p><p>&mdash; нельзя указать больше пяти хэш-тегов;</p>';

}

// Блокировка и разблокировка кнопки
const blockSubmitButton = () => {
  submitButton.disabled = true;
  submitButton.textContent = 'Публикую...';
};

const unblockSubmitButton = () => {
  submitButton.disabled = false;
  submitButton.textContent = 'Опубликовать';
};

// Проверка на валидность с отменой отправки

const setUserFormSubmit = (onSuccess) => {
  uploadForm.addEventListener('submit', (evt) => {
    evt.preventDefault();

    const isValid = pristine.validate();
    if (isValid) {
      blockSubmitButton();
      sendData(
        () => {
          onSuccess();
          unblockSubmitButton();
        },
        () => {
          unblockSubmitButton();
          // document.querySelector('.img-upload__overlay').classList.add('hidden');
        },
        new FormData(evt.target),
      );
    }
    if (!isValid) {
      evt.preventDefault();
    }
  });
};

export {closeUploadForm, setUserFormSubmit};
