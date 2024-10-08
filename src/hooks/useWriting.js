import { useState, useEffect } from 'react';
import { useCookies } from 'react-cookie';
import { postWriting, getWriting, getFeedback } from '../api/writingApi';
import useWritingStore from '../store/useWritingStore';
import { parseDateString } from '../utils/dateAndTime';

const useWriting = (writingId) => {
    const [cookies] = useCookies(['accessToken']);
    const [content, setContent] = useState(sessionStorage.getItem(`writing_${writingId}`) ?? '');
    const [assignment, setAssignment] = useState(null);
    const [feedback, setFeedback] = useState('');
    const [isWaitingForFeedback, setIsWaitingForFeedback] = useState(false);
    const [writingList] = useWritingStore((state) => [state.writingList, state.setWritingList]);
    const [isLoading, setIsLoading] = useState(false);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        const assignment = writingList.find((item) => item.id === parseInt(writingId));
        if (!assignment) {
            setIsLoading(false);
            return;
        }
        setAssignment(assignment);

        getWriting(cookies.accessToken, writingId)
            .then((res) => {
                const savedContent = sessionStorage.getItem(`writing_${writingId}`);
                if (savedContent) {
                    setContent(savedContent);
                } else {
                    setContent(res.data.content);
                    sessionStorage.setItem(`writing_${writingId}`, res.data.content);
                }
                setFeedback('');
                const now = new Date();
                if (parseDateString(assignment.startDate) <= now && parseDateString(assignment.endDate) >= now) {
                    setIsExpired(false);
                } else {
                    setIsExpired(true);
                }
            })
            .catch((error) => {
                alert(error.message);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [writingId, cookies.accessToken, writingList]);

    const handleContentChange = (newContent) => {
        setContent(newContent);
        sessionStorage.setItem(`writing_${writingId}`, newContent);
    };

    const handleSaveClick = () => {
        if(!content.trim()) {
            alert('내용을 입력해주세요.');
            return;
        }
        if (content.trim().length > 1500) {
            alert('글자수가 너무 많습니다. 1500자 이하로 작성해주세요.');
            return;
        }
        setIsLoading(true);
        postWriting(cookies.accessToken, writingId, 1, content)
            .then(() => {
                alert('과제가 제출되었습니다.');
                sessionStorage.removeItem(`writing_${writingId}`);

                setAssignment((prevAssignment) => ({
                    ...prevAssignment,
                    writingState: 1,
                }));
                setIsWaitingForFeedback(false);
                setFeedback('');
            })
            .catch((error) => {
                if (error.message === 'EXPIRED_ASSIGNMENT') {
                    alert('과제 제출 기간이 아닙니다.');
                } else {
                    alert(error.message);
                }
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const handleFeedbackClick = () => {
        if(!content.trim()) {
            alert('내용을 입력해주세요.');
            return;
        }
        if (content.trim().length > 1500) {
            alert('글자수가 너무 많습니다. 1500자 이하로 작성해주세요.');
            return;
        }
        setFeedback('');
        setIsWaitingForFeedback(true);
        const content2 = `${content.trim()}\nNumber of Characters: ${content.trim().length}`;
        getFeedback(cookies.accessToken, writingId, content2)
            .then((res) => {
                setFeedback(res.data.feedback);
                setIsWaitingForFeedback(false);
            })
            .catch((error) => {
                alert(error.message);
                setIsWaitingForFeedback(false);
            });
    };

    return {
        content,
        handleContentChange,
        assignment,
        feedback,
        handleSaveClick,
        handleFeedbackClick,
        isWaitingForFeedback,
        isLoading,
        isExpired
    };
};

export default useWriting;