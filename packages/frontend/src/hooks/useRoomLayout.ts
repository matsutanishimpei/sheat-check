import { useState, useEffect } from 'react';
import client from '../lib/hc';
import { GridItem, RoomLayout } from '@my-app/shared';

export interface EditorCase {
  caseName: string;
  grid: Record<string, GridItem['type']>;
}

interface UseRoomLayoutProps {
  addToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  onClearLiveStatuses: () => void;
  supabaseUrl: string;
  supabaseAnonKey: string;
  setSupabaseUrl: (val: string) => void;
  setSupabaseAnonKey: (val: string) => void;
}

export function useRoomLayout({
  addToast,
  onClearLiveStatuses,
  supabaseUrl,
  supabaseAnonKey,
  setSupabaseUrl,
  setSupabaseAnonKey,
}: UseRoomLayoutProps) {
  const [roomName, setRoomName] = useState('一般講義室 301');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [cases, setCases] = useState<EditorCase[]>([
    { caseName: '通常講義 (標準)', grid: {} },
    { caseName: 'グループワーク', grid: {} }
  ]);
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);
  const [savedRooms, setSavedRooms] = useState<{ id: string; name: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  const fetchRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const res = await client.api.rooms.$get();
      if (res.ok) {
        const data = await res.json();
        setSavedRooms(data.rooms);
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const loadClassroom = async (id: string) => {
    try {
      const res = await client.api.rooms[':id'].$get({
        param: { id },
      });

      if (res.ok) {
        const data = await res.json();
        setRoomId(data.id);
        setRoomName(data.name);
        
        // Load Supabase configurations into state
        setSupabaseUrl(data.supabaseUrl);
        setSupabaseAnonKey(data.supabaseAnonKey);

        const loadedCases: EditorCase[] = data.layouts.map((l: any) => {
          const gridObj: Record<string, GridItem['type']> = {};
          l.grid.forEach((item: GridItem) => {
            gridObj[`${item.x},${item.y}`] = item.type;
          });

          return {
            caseName: l.caseName,
            grid: gridObj,
          };
        });

        setCases(loadedCases);
        setActiveCaseIdx(0);
        addToast('success', `教室「${data.name}」を復元しました`);
      } else {
        addToast('error', '教室データの読み込みに失敗しました');
      }
    } catch (err: any) {
      addToast('error', `読み込みエラー: ${err.message}`);
    }
  };

  const saveClassroom = async () => {
    if (!roomName.trim()) {
      addToast('error', '教室名を入力してください');
      return;
    }
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      addToast('error', '教室を保存するには、先に教員用設定パネルから Supabase 接続設定を保存してください。');
      return;
    }

    setIsSaving(true);
    
    const formattedLayouts: RoomLayout[] = cases.map((c) => {
      const gridItems: GridItem[] = Object.entries(c.grid).map(([coord, type]) => {
        const [xStr, yStr] = coord.split(',');
        return {
          x: parseInt(xStr, 10),
          y: parseInt(yStr, 10),
          type,
        };
      });

      return {
        roomName,
        caseName: c.caseName,
        grid: gridItems,
      };
    });

    try {
      if (roomId) {
        const res = await client.api.rooms[':id'].$put({
          param: { id: roomId },
          json: {
            name: roomName,
            layouts: formattedLayouts,
            supabaseUrl,
            supabaseAnonKey,
          },
        });

        if (res.ok) {
          addToast('success', `教室「${roomName}」のレイアウトを更新しました！`);
          fetchRooms();
        } else {
          const errData = await res.json() as any;
          addToast('error', `保存に失敗しました: ${errData.error || '不明なエラー'}`);
        }
      } else {
        const res = await client.api.rooms.$post({
          json: {
            name: roomName,
            layouts: formattedLayouts,
            supabaseUrl,
            supabaseAnonKey,
          },
        });

        if (res.ok) {
          const data = await res.json() as any;
          setRoomId(data.id);
          addToast('success', `新規教室「${roomName}」を作成・保存しました！`);
          fetchRooms();
        } else {
          const errData = await res.json() as any;
          addToast('error', `作成に失敗しました: ${errData.error || '不明なエラー'}`);
        }
      }
    } catch (err: any) {
      addToast('error', `通信エラーが発生しました: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const createNewClassroomSession = () => {
    setRoomId(null);
    setRoomName('新規講義室');
    setCases([{ caseName: '通常講義 (標準)', grid: {} }]);
    setActiveCaseIdx(0);
    onClearLiveStatuses();
    addToast('info', '新しい教室の編集スタジオを開始しました');
  };

  const addNewCase = () => {
    if (cases.length >= 5) {
      addToast('error', '最大5ケースまでしか保存できません');
      return;
    }
    const newCaseNum = cases.length + 1;
    setCases([...cases, { caseName: `ケース ${newCaseNum}`, grid: {} }]);
    setActiveCaseIdx(cases.length);
    addToast('success', `新しいケース ${newCaseNum} を追加しました`);
  };

  const deleteCurrentCase = () => {
    if (cases.length <= 1) {
      addToast('error', '少なくとも1つのレイアウトケースが必要です');
      return;
    }
    const filtered = cases.filter((_, idx) => idx !== activeCaseIdx);
    setCases(filtered);
    setActiveCaseIdx(Math.max(0, activeCaseIdx - 1));
    addToast('info', 'レイアウトケースを削除しました');
  };

  const updateActiveCaseName = (newName: string) => {
    setCases((prevCases) => {
      const updated = [...prevCases];
      updated[activeCaseIdx] = {
        ...updated[activeCaseIdx],
        caseName: newName,
      };
      return updated;
    });
  };

  const updateGridCell = (x: number, y: number, type?: GridItem['type'], onRemoveStatus?: (key: string) => void) => {
    setCases((prevCases) => {
      const updated = [...prevCases];
      const key = `${x},${y}`;
      const newGrid = { ...updated[activeCaseIdx].grid };

      if (type) {
        newGrid[key] = type;
      } else {
        delete newGrid[key];
        if (onRemoveStatus) {
          onRemoveStatus(key);
        }
      }

      updated[activeCaseIdx] = {
        ...updated[activeCaseIdx],
        grid: newGrid,
      };
      return updated;
    });
  };

  const clearCurrentGrid = () => {
    setCases((prevCases) => {
      const updated = [...prevCases];
      updated[activeCaseIdx] = {
        ...updated[activeCaseIdx],
        grid: {},
      };
      return updated;
    });
    onClearLiveStatuses();
    addToast('info', 'レイアウトをクリアしました');
  };

  const applyRowPreset = () => {
    const newGrid: Record<string, GridItem['type']> = {
      '4,0': 'teacher',
      '0,8': 'door',
      '8,8': 'door',
    };

    for (let y = 2; y <= 7; y++) {
      for (let x = 1; x <= 7; x++) {
        if (x !== 3) {
          newGrid[`${x},${y}`] = 'student';
        }
      }
    }

    setCases((prevCases) => {
      const updated = [...prevCases];
      updated[activeCaseIdx] = {
        ...updated[activeCaseIdx],
        grid: newGrid,
      };
      return updated;
    });
    onClearLiveStatuses();
    addToast('success', '標準的な列配置プリセットを適用しました！');
  };

  return {
    roomName,
    setRoomName,
    roomId,
    setRoomId,
    cases,
    setCases,
    activeCaseIdx,
    setActiveCaseIdx,
    savedRooms,
    isLoadingRooms,
    isSaving,
    fetchRooms,
    loadClassroom,
    saveClassroom,
    createNewClassroomSession,
    addNewCase,
    deleteCurrentCase,
    updateActiveCaseName,
    updateGridCell,
    clearCurrentGrid,
    applyRowPreset,
  };
}
