import { useNavigate } from "react-router-dom";
import { useDbStore } from "../store/useDbStore";

export const useDb = () => {
    const navigate = useNavigate();
    const { openDatabase } = useDbStore();

    const handleOpenDB = async () => {
        try {
            const tbls = await openDatabase();
            if (tbls === null) return;
            if (tbls.length > 0) {
                navigate(`/tables/${tbls[0]}`);
            }
        } catch (err) {
            console.error("Failed to open DB:", err);
        }
    };

    return {
        handleOpenDB,
    };
};
