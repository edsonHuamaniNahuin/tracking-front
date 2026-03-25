export class VesselValidator {
    static validateName(value: string): string | null {
        return value.trim() === "" ? "El nombre es requerido" : null
    }

    static validateImo(value: string): string | null {
        if (value.trim() === "") {
            return "El IMO es requerido"
        }
        return /^IMO\d+$/.test(value)
            ? null
            : "El IMO debe tener el formato IMO seguido de números"
    }

    static validateVesselTypeId(value: string): string | null {
        return value === "" ? "Debes seleccionar un tipo" : null
    }

    static validateVesselStatusId(value: string): string | null {
        return value === "" ? "Debes seleccionar un estado" : null
    }

    static validateDescription(value: string): string | null {
        return value.trim().length > 0 && value.trim().length < 10
            ? "La descripción debe tener al menos 10 caracteres"
            : null
    }

    static validatePhotoUrl(value: string): string | null {
        if (!value) return null
        try {
            new URL(value)
            return null
        } catch {
            return "La URL de la foto no es válida"
        }
    }
}
