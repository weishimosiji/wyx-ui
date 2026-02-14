import Button from "./components/Button/Button";
import BorderText from "./components/BorderText/BorderText";
import AutoInput from './components/AutoInput/AutoInput';
import FlipCard from './components/FlipCard/FlipCard';
import Btns from './components/AnimateBtns/index';
import CopyBtn from './components/CopyBtn/CopyBtn';
import Message from './components/Message/Message';
import Modal from './components/Modal/Modal';
import Note from './components/Note/Note';
import NoteBox from './components/NoteBox/NoteBox';
import Icons from './components/Icons/index';
import Popover from './components/Popover/Popover';
import Count from './components/Count/Count';
import Image from './components/Image/Image';
export { openImagePreview } from './components/Image/preview';
import Color from './components/Color/Color';
import Marquee from './components/Marquee/Marquee';
import Swiper from './components/Swiper/Swiper';
import PointText from './components/PointText/PointText';
import Danmu from './components/Danmu/Danmu';
import TimeLine from './components/TimeLine/TimeLine';
export { useDanmuChannel } from './components/Danmu/Danmu';
import Progress from './components/Progress/Progress';
import SplitText from './components/SplitText/SplitText';
import TransformText from './components/TransformText/TransformText';
export type { TransformTextRef } from './components/TransformText/TransformText';
import TypeText from './components/TypeText/TypeText';
export type { TypeTextRef } from './components/TypeText/TypeText';
import Lens from './components/Lens/Lens';
import MorphingText from './components/MorphingText/MorphingText';
import Badge from './components/Badge/Badge';
import Avatar from './components/Avatar/Avatar';
import Range from './components/Range/Range';
import Switch from './components/Switch/Switch';
import Select from './components/Select/Select';
import Radio from './components/Radio/Radio';
import CheckBox from './components/CheckBox/CheckBox';
import Rate from './components/Rate/Rate';
import DateSelect from './components/DateSelect/DateSelect';
import Calendar from './components/Calendar/Calendar';
export type {
  CalendarSelectInfo,
  CalendarMark,
  CalendarHoliday,
  CalendarMarkRenderInfo,
  CalendarMarkEvent,
  CalendarMarkVariant,
  CalendarRef,
} from './components/Calendar/Calendar';

export { ClipboardManager } from './components/CopyBtn/copy';

export { Button, BorderText, AutoInput, FlipCard, Btns, CopyBtn, Message, Modal, Note, NoteBox, Icons, Popover, Count, Image, Color, Marquee, Swiper, PointText, Danmu, TimeLine, Progress, SplitText, TransformText, TypeText, Lens, MorphingText, Badge, Avatar, Range, Switch, Select, Radio, CheckBox, Rate, DateSelect, Calendar }; 
export { openModal } from './components/Modal/Modal';
export { openNote } from './components/Note/Note';
export { openNoteBox } from './components/NoteBox/NoteBox';

export {
  switchTheme,
  getCurrentTheme,
  getAvailableThemes,
  addTheme,
  updateTheme,
  ThemeName
} from './theme/themeManage';

export { themeTransition } from './theme/transition';
