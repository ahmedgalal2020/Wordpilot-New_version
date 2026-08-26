import { ShadowingPracticeView } from './ShadowingPracticeView';
import { useShadowingPractice } from './useShadowingPractice';

export default function ShadowingPractice() {
  const workspace = useShadowingPractice();
  return <ShadowingPracticeView workspace={workspace} />;
}
